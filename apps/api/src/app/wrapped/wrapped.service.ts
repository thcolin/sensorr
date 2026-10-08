import { randomBytes } from 'node:crypto'
import fetch from 'node-fetch'
import { Model } from 'mongoose'
import { BadGatewayException, BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { editionBounds, editionOf, enabledOf, lookOf, partsOf, watchedHoursOf, wrappedOf, WrappedEdition, WrappedPlay, WrappedTitle, WRAPPED_TIME_ZONE as TIME_ZONE } from '@sensorr/sensorr'
import { Guest as GuestDocument } from '../guests/guest.schema'
import { ConfigService } from '../config/config.service'
import { MailService } from '../mail/mail.service'
import { TMDB } from '../plex/image'
import { mails } from '../mail/templates'
import { Play, Viewer, Title, Edition } from './wrapped.schema'
import { coded } from '../errors'

const IMAGE_WIDTHS = [320, 640, 1280]
const TMDB_SIZES = { 320: 'w342', 640: 'w780', 1280: 'w1280' }
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

@Injectable()
export class WrappedService {
  private readonly logger = new Logger(WrappedService.name)

  constructor(
    @InjectModel(Play.name) private readonly playModel: Model<Play>,
    @InjectModel(Viewer.name) private readonly viewerModel: Model<Viewer>,
    @InjectModel(Title.name) private readonly titleModel: Model<Title>,
    @InjectModel(Edition.name) private readonly editionModel: Model<Edition>,
    @InjectModel(GuestDocument.name) private readonly guestModel: Model<GuestDocument>,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
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
      throw new BadRequestException(coded('wrapped.prune', `No play seen by run "${seen}", nothing pruned`, { seen }))
    }

    const { deletedCount } = await this.playModel.deleteMany({ seen: { $ne: seen } })
    this.logger.log(`PrunePlays "${seen}", ${deletedCount} deleted`)
    return { deleted: deletedCount }
  }

  async playsRange(): Promise<{ first: number | null, last: number | null }> {
    const [first, last] = await Promise.all([1, -1].map((order) => this.playModel.findOne({}, { started: 1 }).sort({ started: order as 1 | -1 }).lean()))
    return { first: first?.started ?? null, last: last?.started ?? null }
  }

  // The years Tautulli has plays for, up to the one shown now: in December the next one has barely started
  async years(): Promise<number[]> {
    const { first, last } = await this.playsRange()

    if (first === null) {
      return []
    }

    const years = []

    for (let year = editionOf(first, TIME_ZONE); year <= Math.min(editionOf(last, TIME_ZONE), this.shownEdition()); year++) {
      const { start, end } = editionBounds(year, TIME_ZONE)

      if (await this.playModel.exists({ started: { $gte: start, $lt: end } })) {
        years.push(year)
      }
    }

    return years
  }

  private get editions(): WrappedEdition[] {
    return this.configService.config.get('wrapped.editions')
  }

  // A title read before the actors were kept, or still without a poster, is read again
  async titleKeys(): Promise<string[]> {
    return (await this.titleModel.find({ actors: { $exists: true }, thumb: { $nin: [null, ''] } }, { _id: 1 }).lean()).map(({ _id }) => _id)
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
    if (!enabledOf(this.editions, year)) {
      this.logger.log(`Freeze "${year}", turned off in Settings`)
      return { year, frozen: 0 }
    }

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

    // Only the edition that just closed: a friend matched late to Tautulli would otherwise get one mail per past year
    if (upsertedCount && year === editionOf(Date.now() / 1000, TIME_ZONE) - 1 && this.mailService.enabled('wrapped')) {
      await this.mailFrozen(year, users)
    }

    return { year, frozen: upsertedCount }
  }

  private async mailFrozen(year: number, users: number[]) {
    const viewers = await this.viewerModel.find({ _id: { $in: users }, email: { $nin: [null, ''] } }, { email: 1 }).lean()
    // Plex keeps the case of an address, Tautulli does not
    const guests = await this.guestModel.find({ email: { $in: viewers.map(({ email }) => email) } }).collation({ locale: 'en', strength: 2 }).lean()

    for (const guest of guests) {
      await this.mailWrapped(guest, year).catch((error) => this.logger.warn(`Wrapped "${guest.email}" not sent: ${error.message}`))
    }
  }

  private async mailWrapped(guest, year: number) {
    const viewer = await this.viewerOf(guest.email)
    const token = await this.tokenOf(guest.email)
    const { theme } = this.lookOf(year)
    await this.mailService.send(guest.email, mails.wrapped({
      t: this.mailService.t(),
      url: this.mailService.url(),
      sender: this.mailService.sender(),
      name: viewer?.username || viewer?.friendly_name || guest.name,
      token,
      year,
      look: theme,
      open: year >= editionOf(Date.now() / 1000, TIME_ZONE),
    }))
    await this.guestModel.updateOne({ email: guest.email }, { wrapped_mailed_at: Date.now() })
  }

  // Two polls of one PIN may ask at once: only the first writes a token
  private async tokenOf(email: string) {
    await this.guestModel.updateOne({ email, wrapped_token: { $exists: false } }, { wrapped_token: randomBytes(18).toString('base64url') })
    return (await this.guestModel.findOne({ email }, { wrapped_token: 1 }).lean()).wrapped_token
  }

  // What Keep in touch shows a friend who just linked their Plex account, when their wrapped opens
  async linkOf(email: string) {
    const year = await this.openedEdition(email)
    return year ? { token: await this.tokenOf(email), look: this.lookOf(year).theme } : null
  }

  // Sent from the Friends page, with the edition the link opens on
  async mail(email: string) {
    const guest = typeof email === 'string' ? await this.guestModel.findOne({ email }).lean() : null

    if (!guest || !(await this.viewerOf(guest.email))) {
      throw new NotFoundException()
    }

    const year = await this.openedEdition(guest.email)

    if (!year) {
      throw new BadRequestException(coded('wrapped.closed', 'No year of their wrapped is open, turn one on in Settings'))
    }

    await this.mailWrapped(guest, year)
    const { wrapped_token, wrapped_mailed_at } = await this.guestModel.findOne({ email }).lean()
    return { email, wrapped_token, wrapped_mailed_at }
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

  // The years a friend can open, frozen for them or still open, without the ones turned off
  private async editionsOf(user_id: number) {
    const frozen = (await this.editionModel.find({ user_id }, { year: 1 }).lean()).map(({ year }) => year)
    return [...new Set([...frozen, this.shownEdition()])].filter((year) => enabledOf(this.editions, year)).sort((a, b) => a - b)
  }

  // The year a link opens on: the one it asks for, else the one shown now, or the last one still open when it is turned off
  private async openedEdition(email: string, year?: number) {
    const viewer = await this.viewerOf(email)
    const editions = viewer ? await this.editionsOf(viewer._id) : []
    return year && editions.includes(year) ? year : editions.includes(this.shownEdition()) ? this.shownEdition() : editions.at(-1) ?? null
  }

  async share(token: string, year?: number) {
    const { guest, viewer } = await this.shareOf(token)
    const edition = await this.openedEdition(guest.email, year)

    if (!edition) {
      throw new NotFoundException()
    }

    this.logger.log(`Share "${guest.email}", edition "${edition}"`)
    const shown = await this.wrapped(viewer._id, edition)
    return {
      // The Plex username, never the first and last name a Plex account may carry
      name: viewer.username || viewer.friendly_name || guest.name,
      server: await this.mailService.server(),
      year: edition,
      editions: await this.editionsOf(viewer._id),
      names: await this.namesOf(shown.wrapped),
      look: { ...this.lookOf(edition), looks: this.configService.config.get('wrapped.looks') },
      // The page speaks the language set in Settings, else the friend's browser's, else the one of the TMDB region
      language: this.configService.config.get('language'),
      region: this.configService.config.get('region'),
      ...shown,
    }
  }

  // The viewers a wrapped matches with, by their Plex username, read when shown so a rename applies
  private async namesOf(wrapped: { twin?: { user_id: number } | null, duo?: { posters: { with: number }[] } | null }) {
    const ids = [wrapped.twin?.user_id, ...(wrapped.duo?.posters || []).map((poster) => poster.with)].filter(Number.isInteger)
    const viewers = ids.length ? await this.viewerModel.find({ _id: { $in: ids } }, { friendly_name: 1, username: 1 }).lean() : []
    return Object.fromEntries(viewers.map(({ _id, friendly_name, username }) => [_id, username || friendly_name]))
  }

  // Only the artwork of what this guest watched in a year they can open, which covers every title of their wrapped
  async image(token: string, key: string, kind: string, width: number) {
    if (typeof key !== 'string' || !['thumb', 'art'].includes(kind) || !IMAGE_WIDTHS.includes(width)) {
      throw new BadRequestException()
    }

    const { viewer } = await this.shareOf(token)
    const [plays, editions, title] = await Promise.all([
      this.playModel.find({ user_id: viewer._id, title: key }, { started: 1 }).lean(),
      this.editionsOf(viewer._id),
      this.titleModel.findById(key, { thumb: 1, art: 1 }).lean(),
    ])
    const watched = plays.some(({ started }) => editions.includes(editionOf(started, TIME_ZONE)))
    const url = this.configService.config.get('tautulli.url')
    // A movie gone from Plex carries a TMDB poster
    const tmdb = TMDB.test(title?.[kind] || '')

    if (!watched || !title?.[kind] || (!tmdb && !url)) {
      throw new NotFoundException()
    }

    const uri = tmdb ? new URL(`https://image.tmdb.org/t/p/${TMDB_SIZES[width]}${title[kind]}`) : new URL('api/v2', url.replace(/\/?$/, '/'))

    if (!tmdb) {
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
    }

    // The route is public, the guest only gets a bare 502; node-fetch errors carry the URL, so the key, and are not logged
    const failed = (reason: string) => {
      this.logger.warn(`Image "${key}", ${reason}`)
      return new BadGatewayException()
    }
    const res = await fetch(uri, { signal: AbortSignal.timeout(10000) }).catch((error) => {
      throw failed(`${tmdb ? 'TMDB' : 'Tautulli'} unreachable: ${error.name} ${error.code || ''}`)
    })
    const type = (res.headers.get('content-type') || '').split(';')[0].trim()

    if (!res.ok || !IMAGE_TYPES.includes(type)) {
      throw failed(`${tmdb ? 'TMDB' : 'Tautulli'} answered ${res.status} with "${type}"`)
    }

    const body = await res.arrayBuffer().catch((error) => {
      throw failed(`${tmdb ? 'TMDB' : 'Tautulli'} body failed: ${error.name} ${error.code || ''}`)
    })

    return { type, buffer: Buffer.from(body) }
  }

  // The look a page wears before it knows its friend: an unknown link, a revoked one, no link at all
  look() {
    return { ...this.lookOf(this.shownEdition()), looks: this.configService.config.get('wrapped.looks') }
  }

  private lookOf(year: number) {
    return lookOf({ looks: this.configService.config.get('wrapped.looks'), edition: this.editions.find((edition) => edition.year === year) })
  }

  async guests() {
    const guests = await this.guestModel.find({}, { email: 1, wrapped_token: 1 }).lean()
    return Promise.all(guests.map(async ({ email, wrapped_token }) => {
      const viewer = await this.viewerOf(email)
      return {
        email,
        wrapped_token: wrapped_token || null,
        viewer: viewer?._id ?? null,
        // The name the wrapped page gives this friend
        username: viewer?.username || viewer?.friendly_name || null,
      }
    }))
  }

  async renewToken(email: string) {
    if (typeof email !== 'string') {
      throw new BadRequestException(coded('wrapped.email', 'An email is required'))
    }

    this.logger.log(`RenewToken "${email}"`)
    const guest = await this.guestModel.findOneAndUpdate({ email }, { wrapped_token: randomBytes(18).toString('base64url') }, { returnDocument: 'after' }).lean()

    if (!guest) {
      throw new NotFoundException()
    }

    return { email, wrapped_token: guest.wrapped_token }
  }
}
