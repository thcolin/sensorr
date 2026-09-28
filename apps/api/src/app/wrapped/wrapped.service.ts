import { randomBytes } from 'node:crypto'
import fetch from 'node-fetch'
import { Model } from 'mongoose'
import { BadGatewayException, BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { WRAPPED_THEMES } from '@sensorr/config'
import { editionBounds, editionOf, lookOf, partsOf, watchedHoursOf, wrappedOf, WrappedPlay, WrappedTheme, WrappedTitle, WRAPPED_TIME_ZONE as TIME_ZONE } from '@sensorr/sensorr'
import { Guest as GuestDocument } from '../guests/guest.schema'
import { ConfigService } from '../config/config.service'
import { Play, Viewer, Title, Edition } from './wrapped.schema'

const IMAGE_WIDTHS = [320, 640, 1280]
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

@Injectable()
export class WrappedService {
  private readonly logger = new Logger(WrappedService.name)

  private serverName: string | null = null

  constructor(
    @InjectModel(Play.name) private readonly playModel: Model<Play>,
    @InjectModel(Viewer.name) private readonly viewerModel: Model<Viewer>,
    @InjectModel(Title.name) private readonly titleModel: Model<Title>,
    @InjectModel(Edition.name) private readonly editionModel: Model<Edition>,
    @InjectModel(GuestDocument.name) private readonly guestModel: Model<GuestDocument>,
    private readonly configService: ConfigService,
  ) {}

  async upsertViewers(viewers: { user_id: number, email: string, username: string, friendly_name: string }[]) {
    this.logger.log(`UpsertViewers "${viewers.length}"`)
    const { upsertedCount, modifiedCount } = await this.viewerModel.bulkWrite(viewers.filter(({ user_id }) => Number.isInteger(user_id)).map(({ user_id, ...viewer }) => ({
      updateOne: { filter: { _id: user_id }, update: { _id: user_id, ...viewer, email: viewer.email?.toLowerCase() }, upsert: true },
    })))
    return { upserted: upsertedCount, modified: modifiedCount }
  }

  async upsertPlays(plays: WrappedPlay[]) {
    this.logger.log(`UpsertPlays "${plays.length}"`)
    const { upsertedCount, modifiedCount } = await this.playModel.bulkWrite(plays.filter(({ id }) => Number.isInteger(id)).map(({ id, ...play }) => ({
      updateOne: { filter: { _id: id }, update: { _id: id, ...play }, upsert: true },
    })))
    return { upserted: upsertedCount, modified: modifiedCount }
  }

  async prunePlays(seen: string) {
    if (typeof seen !== 'string' || !(await this.playModel.exists({ seen }))) {
      throw new BadRequestException(`No play seen by run "${seen}", nothing pruned`)
    }

    const { deletedCount } = await this.playModel.deleteMany({ seen: { $ne: seen } })
    this.logger.log(`PrunePlays "${seen}", ${deletedCount} deleted`)
    return { deleted: deletedCount }
  }

  async playsRange(): Promise<{ first: number | null, last: number | null }> {
    const [first, last] = await Promise.all([1, -1].map((order) => this.playModel.findOne({}, { started: 1 }).sort({ started: order as 1 | -1 }).lean()))
    return { first: first?.started ?? null, last: last?.started ?? null }
  }

  // A title read before the actors were kept is read again
  async titleKeys(): Promise<string[]> {
    return (await this.titleModel.find({ actors: { $exists: true } }, { _id: 1 }).lean()).map(({ _id }) => _id)
  }

  async upsertTitles(titles: WrappedTitle[]) {
    this.logger.log(`UpsertTitles "${titles.length}"`)
    const { upsertedCount, modifiedCount } = await this.titleModel.bulkWrite(titles.filter(({ key }) => typeof key === 'string').map(({ key, ...title }) => ({
      updateOne: { filter: { _id: key }, update: { _id: key, ...title }, upsert: true },
    })))
    return { upserted: upsertedCount, modified: modifiedCount }
  }

  // A day of margin on each side for the time zone
  private editionWindow(year: number) {
    return { $gte: Date.UTC(year - 1, 10, 29) / 1000, $lt: Date.UTC(year, 11, 2) / 1000 }
  }

  private async editionData(year: number): Promise<{ plays: WrappedPlay[], titles: WrappedTitle[], history: Record<string, number[]> }> {
    const docs = await this.playModel.find({ started: this.editionWindow(year) }).lean()
    const plays = docs.map(({ _id, ...play }) => ({ id: _id, ...play }) as WrappedPlay).filter((play) => editionOf(play.started, TIME_ZONE) === year)
    const titles = (await this.titleModel.find({ _id: { $in: [...new Set(plays.map((play) => play.title))] } }).lean())
      .map(({ _id, ...title }) => ({ key: _id, ...title }) as WrappedTitle)
    return { plays, titles, history: await this.historyOf(year, titles.filter((title) => title.media_type === 'movie').map((title) => title.key)) }
  }

  // Who ever watched each of these titles on the server, from the first play Tautulli kept to the end of the edition
  private async historyOf(year: number, keys: string[]) {
    const rows = await this.playModel.aggregate<{ _id: string, users: number[] }>([
      { $match: { title: { $in: keys }, started: { $lt: editionBounds(year, TIME_ZONE).end } } },
      { $group: { _id: '$title', users: { $addToSet: '$user_id' } } },
    ])
    return Object.fromEntries(rows.map(({ _id, users }) => [_id, users]))
  }

  async freeze(year: number) {
    const frozen = new Set((await this.editionModel.find({ year }, { user_id: 1 }).lean()).map(({ user_id }) => user_id))
    const { plays, titles, history } = await this.editionData(year)
    const users = [...new Set(plays.map((play) => play.user_id))].filter((user_id) => !frozen.has(user_id))

    if (!users.length) {
      return { year, frozen: 0 }
    }

    const frozen_at = Date.now()
    const previous = await this.previousOf(year)
    const { upsertedCount } = await this.editionModel.bulkWrite(users.map((user_id) => ({
      updateOne: {
        filter: { year, user_id },
        update: { $setOnInsert: { year, user_id, frozen_at, wrapped: wrappedOf({ plays, titles, user_id, year, previous: previous.get(user_id), history, timeZone: TIME_ZONE }) } },
        upsert: true,
      },
    })))
    this.logger.log(`Freeze "${year}", ${upsertedCount} users`)
    return { year, frozen: upsertedCount }
  }

  async wrapped(user_id: number, year: number) {
    const edition = await this.editionModel.findOne({ year, user_id }).lean()

    if (edition) {
      return { frozen: true, wrapped: edition.wrapped }
    }

    const { plays, titles, history } = await this.editionData(year)
    return { frozen: false, wrapped: wrappedOf({ plays, titles, user_id, year, previous: await this.samePeriodOf(year, user_id), history, timeZone: TIME_ZONE }) }
  }

  // An open edition is compared with the previous one up to the same day, not with its whole year
  private async samePeriodOf(year: number, user_id: number) {
    const { start, end } = editionBounds(year, TIME_ZONE)
    const before = editionBounds(year - 1, TIME_ZONE).start
    const plays = (await this.playModel.find({ user_id, started: { $gte: before, $lt: before + Math.min(Date.now() / 1000, end) - start } }).lean())
      .map(({ _id, ...play }) => ({ id: _id, ...play }) as WrappedPlay)
    const titles = (await this.titleModel.find({ _id: { $in: [...new Set(plays.map((play) => play.title))] } }, { duration: 1 }).lean())
      .map(({ _id, ...title }) => ({ key: _id, ...title }) as WrappedTitle)
    return plays.length ? { hours: watchedHoursOf({ plays, titles, user_id }) } : null
  }

  // A closed edition is compared with the whole previous one, frozen by then
  private async previousOf(year: number) {
    const editions = await this.editionModel.find({ year: year - 1 }, { user_id: 1, 'wrapped.hours': 1 }).lean()
    return new Map(editions.map(({ user_id, wrapped }) => [user_id, wrapped as { hours: number }]))
  }

  // In December the edition that just closed is the one to show, the next one has barely started
  shownEdition(now = Date.now() / 1000) {
    return partsOf(now, TIME_ZONE).year
  }

  private async viewerOf(email: string) {
    return email ? this.viewerModel.findOne({ email: email.toLowerCase() }).lean() : null
  }

  private async shareOf(token: string) {
    const guest = typeof token === 'string' && token ? await this.guestModel.findOne({ wrapped_token: token }).lean() : null
    const viewer = guest && await this.viewerOf(guest.email)

    if (!viewer) {
      throw new NotFoundException()
    }

    return { guest, viewer }
  }

  async share(token: string, year?: number) {
    const { guest, viewer } = await this.shareOf(token)
    const edition = year || this.shownEdition()
    const editions = (await this.editionModel.find({ user_id: viewer._id }, { year: 1 }).lean()).map(({ year }) => year)
    this.logger.log(`Share "${guest.email}", edition "${edition}"`)
    const shown = await this.wrapped(viewer._id, edition)
    return {
      // The Plex username, never the first and last name a Plex account may carry
      name: viewer.username || viewer.friendly_name || guest.name,
      server: await this.serverNameOf(),
      year: edition,
      editions: [...new Set([...editions, this.shownEdition()])].sort((a, b) => a - b),
      names: await this.namesOf(shown.wrapped),
      look: this.lookOf(guest, edition),
      ...shown,
    }
  }

  // The viewers a wrapped matches with, by their Plex username, read when shown so a rename applies
  private async namesOf(wrapped: { twin?: { user_id: number } | null, duo?: { posters: { with: number }[] } | null }) {
    const ids = [wrapped.twin?.user_id, ...(wrapped.duo?.posters || []).map((poster) => poster.with)].filter(Number.isInteger)
    const viewers = ids.length ? await this.viewerModel.find({ _id: { $in: ids } }, { friendly_name: 1, username: 1 }).lean() : []
    return Object.fromEntries(viewers.map(({ _id, friendly_name, username }) => [_id, username || friendly_name]))
  }

  // Read once from Tautulli; without it the page names no server
  private async serverNameOf() {
    const url = this.configService.config.get('tautulli.url')

    if (!this.serverName && url) {
      const uri = new URL('api/v2', url.replace(/\/?$/, '/'))
      uri.search = new URLSearchParams({ apikey: this.configService.config.get('tautulli.key'), cmd: 'get_server_friendly_name' }).toString()
      // node-fetch errors carry the URL, so the key, and are not logged
      const body = await fetch(uri, { signal: AbortSignal.timeout(5000) }).then((res) => res.ok ? res.json() as Promise<{ response?: { data?: unknown } }> : null).catch((error) => {
        this.logger.warn(`Server name, Tautulli unreachable: ${error.name} ${error.code || ''}`)
        return null
      })
      this.serverName = typeof body?.response?.data === 'string' ? body.response.data : null
    }

    return this.serverName
  }

  // Only the artwork of what this guest watched in the shown edition, which covers every title of their wrapped
  async image(token: string, key: string, kind: string, width: number) {
    if (typeof key !== 'string' || !['thumb', 'art'].includes(kind) || !IMAGE_WIDTHS.includes(width)) {
      throw new BadRequestException()
    }

    const { viewer } = await this.shareOf(token)
    const { start, end } = editionBounds(this.shownEdition(), TIME_ZONE)
    const [watched, title] = await Promise.all([
      this.playModel.exists({ user_id: viewer._id, title: key, started: { $gte: start, $lt: end } }),
      this.titleModel.findById(key, { thumb: 1, art: 1 }).lean(),
    ])
    const url = this.configService.config.get('tautulli.url')

    if (!watched || !title?.[kind] || !url) {
      throw new NotFoundException()
    }

    const uri = new URL('api/v2', url.replace(/\/?$/, '/'))
    uri.search = new URLSearchParams({
      apikey: this.configService.config.get('tautulli.key'),
      cmd: 'pms_image_proxy',
      img: title[kind],
      width: String(width),
      height: String(Math.round(kind === 'thumb' ? width * 1.5 : width * 9 / 16)),
      fallback: kind === 'thumb' ? 'poster' : 'art',
      // PNG by default, seven times heavier
      img_format: 'jpg',
    }).toString()
    // The route is public, the guest only gets a bare 502; node-fetch errors carry the URL, so the key, and are not logged
    const failed = (reason: string) => {
      this.logger.warn(`Image "${key}", ${reason}`)
      return new BadGatewayException()
    }
    const res = await fetch(uri, { signal: AbortSignal.timeout(10000) }).catch((error) => {
      throw failed(`Tautulli unreachable: ${error.name} ${error.code || ''}`)
    })
    const type = (res.headers.get('content-type') || '').split(';')[0].trim()

    if (!res.ok || !IMAGE_TYPES.includes(type)) {
      throw failed(`Tautulli answered ${res.status} with "${type}"`)
    }

    const body = await res.arrayBuffer().catch((error) => {
      throw failed(`Tautulli body failed: ${error.name} ${error.code || ''}`)
    })

    return { type, buffer: Buffer.from(body) }
  }

  // The look a page wears before it knows its friend: an unknown link, a revoked one, no link at all
  look() {
    return this.lookOf({}, this.shownEdition())
  }

  private lookOf(guest: { wrapped_theme?: string | null, wrapped_choice?: boolean | null }, year: number) {
    const { config } = this.configService

    return lookOf({
      global: { theme: config.get('wrapped.theme'), choice: config.get('wrapped.choice') },
      edition: config.get('wrapped.editions').find((edition) => edition.year === year),
      // A look since removed from the list falls back to the edition's or the global one
      guest: { theme: WRAPPED_THEMES.includes(guest.wrapped_theme) ? guest.wrapped_theme as WrappedTheme : null, choice: guest.wrapped_choice },
    })
  }

  async guests() {
    const guests = await this.guestModel.find({}, { email: 1, wrapped_token: 1, wrapped_theme: 1, wrapped_choice: 1 }).lean()
    return Promise.all(guests.map(async ({ email, wrapped_token, wrapped_theme, wrapped_choice }) => {
      const viewer = await this.viewerOf(email)
      return {
        email,
        wrapped_token: wrapped_token || null,
        wrapped_theme: wrapped_theme ?? null,
        wrapped_choice: wrapped_choice ?? null,
        viewer: viewer?._id ?? null,
        // The name the wrapped page gives this friend
        username: viewer?.username || viewer?.friendly_name || null,
      }
    }))
  }

  async setLook(email: string, theme: string | null, choice: boolean | null) {
    if (typeof email !== 'string') {
      throw new BadRequestException('An email is required')
    }

    if (theme !== null && !WRAPPED_THEMES.includes(theme)) {
      throw new BadRequestException(`The theme must be one of ${WRAPPED_THEMES.join(', ')}, or null`)
    }

    if (choice !== null && typeof choice !== 'boolean') {
      throw new BadRequestException('The choice must be a boolean, or null')
    }

    this.logger.log(`SetLook "${email}", theme "${theme}", choice "${choice}"`)
    const guest = await this.guestModel.findOneAndUpdate({ email }, { wrapped_theme: theme, wrapped_choice: choice }, { new: true }).lean()

    if (!guest) {
      throw new NotFoundException()
    }

    return { email, wrapped_theme: guest.wrapped_theme ?? null, wrapped_choice: guest.wrapped_choice ?? null }
  }

  async renewToken(email: string) {
    if (typeof email !== 'string') {
      throw new BadRequestException('An email is required')
    }

    this.logger.log(`RenewToken "${email}"`)
    const guest = await this.guestModel.findOneAndUpdate({ email }, { wrapped_token: randomBytes(18).toString('base64url') }, { new: true }).lean()

    if (!guest) {
      throw new NotFoundException()
    }

    return { email, wrapped_token: guest.wrapped_token }
  }
}
