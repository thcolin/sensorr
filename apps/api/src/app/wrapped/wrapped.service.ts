import crypto from 'node:crypto'
import { Model } from 'mongoose'
import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { editionOf, partsOf, wrappedOf, WrappedPlay, WrappedTitle } from '@sensorr/sensorr'
import { Guest as GuestDocument } from '../guests/guest.schema'
import { Play, Viewer, Title, Edition } from './wrapped.schema'

const TIME_ZONE = 'Europe/Paris'

@Injectable()
export class WrappedService {
  private readonly logger = new Logger(WrappedService.name)

  constructor(
    @InjectModel(Play.name) private readonly playModel: Model<Play>,
    @InjectModel(Viewer.name) private readonly viewerModel: Model<Viewer>,
    @InjectModel(Title.name) private readonly titleModel: Model<Title>,
    @InjectModel(Edition.name) private readonly editionModel: Model<Edition>,
    @InjectModel(GuestDocument.name) private readonly guestModel: Model<GuestDocument>,
  ) {}

  async upsertViewers(viewers: { user_id: number, email: string, username: string, friendly_name: string }[]) {
    this.logger.log(`UpsertViewers "${viewers.length}"`)
    const { upsertedCount, modifiedCount } = await this.viewerModel.bulkWrite(viewers.map(({ user_id, ...viewer }) => ({
      updateOne: { filter: { _id: user_id }, update: { _id: user_id, ...viewer }, upsert: true },
    })))
    return { upserted: upsertedCount, modified: modifiedCount }
  }

  async upsertPlays(plays: WrappedPlay[]) {
    this.logger.log(`UpsertPlays "${plays.length}"`)
    const { upsertedCount, modifiedCount } = await this.playModel.bulkWrite(plays.map(({ id, ...play }) => ({
      updateOne: { filter: { _id: id }, update: { _id: id, ...play }, upsert: true },
    })))
    return { upserted: upsertedCount, modified: modifiedCount }
  }

  async lastPlay(): Promise<{ started: number | null }> {
    const last = await this.playModel.findOne({}, { started: 1 }).sort({ started: -1 }).lean()
    return { started: last?.started ?? null }
  }

  async titleKeys(): Promise<string[]> {
    return (await this.titleModel.find({}, { _id: 1 }).lean()).map(({ _id }) => _id)
  }

  async upsertTitles(titles: WrappedTitle[]) {
    this.logger.log(`UpsertTitles "${titles.length}"`)
    const { upsertedCount, modifiedCount } = await this.titleModel.bulkWrite(titles.map(({ key, ...title }) => ({
      updateOne: { filter: { _id: key }, update: { _id: key, ...title }, upsert: true },
    })))
    return { upserted: upsertedCount, modified: modifiedCount }
  }

  // The plays and titles of an edition, a day of margin on each side for the time zone
  private async editionData(year: number): Promise<{ plays: WrappedPlay[], titles: WrappedTitle[] }> {
    const docs = await this.playModel.find({ started: { $gte: Date.UTC(year - 1, 10, 29) / 1000, $lt: Date.UTC(year, 11, 2) / 1000 } }).lean()
    const plays = docs.map(({ _id, ...play }) => ({ id: _id, ...play }) as WrappedPlay).filter((play) => editionOf(play.started, TIME_ZONE) === year)
    const titles = (await this.titleModel.find({ _id: { $in: [...new Set(plays.map((play) => play.title))] } }).lean())
      .map(({ _id, ...title }) => ({ key: _id, ...title }) as WrappedTitle)
    return { plays, titles }
  }

  async freeze(year: number) {
    if (await this.editionModel.exists({ year })) {
      this.logger.log(`Freeze "${year}", already frozen`)
      return { year, frozen: 0 }
    }

    const { plays, titles } = await this.editionData(year)
    const users = [...new Set(plays.map((play) => play.user_id))]
    const frozen_at = Date.now()
    await this.editionModel.insertMany(users.map((user_id) => ({ year, user_id, frozen_at, wrapped: wrappedOf({ plays, titles, user_id, year, timeZone: TIME_ZONE }) })))
    this.logger.log(`Freeze "${year}", ${users.length} users`)
    return { year, frozen: users.length }
  }

  async wrapped(user_id: number, year: number) {
    const edition = await this.editionModel.findOne({ year, user_id }).lean()

    if (edition) {
      return { frozen: true, wrapped: edition.wrapped }
    }

    const { plays, titles } = await this.editionData(year)
    return { frozen: false, wrapped: wrappedOf({ plays, titles, user_id, year, timeZone: TIME_ZONE }) }
  }

  // In December the edition that just closed is the one to show, the next one has barely started
  currentEdition(now = Date.now() / 1000) {
    const { year, month } = partsOf(now, TIME_ZONE)
    return month === 12 ? year : editionOf(now, TIME_ZONE)
  }

  private async viewerOf(email: string) {
    return email ? this.viewerModel.findOne({ email: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }).lean() : null
  }

  async share(token: string, year?: number) {
    const guest = token ? await this.guestModel.findOne({ wrapped_token: token }).lean() : null
    const viewer = guest && await this.viewerOf(guest.email)

    if (!viewer) {
      throw new NotFoundException()
    }

    const edition = year || this.currentEdition()
    const editions = (await this.editionModel.find({ user_id: viewer._id }, { year: 1 }).lean()).map(({ year }) => year)
    this.logger.log(`Share "${guest.email}", edition "${edition}"`)
    return {
      name: guest.name,
      year: edition,
      editions: [...new Set([...editions, this.currentEdition()])].sort((a, b) => a - b),
      ...(await this.wrapped(viewer._id, edition)),
    }
  }

  async guests() {
    const guests = await this.guestModel.find({}, { email: 1, wrapped_token: 1 }).lean()
    return Promise.all(guests.map(async ({ email, wrapped_token }) => ({ email, wrapped_token: wrapped_token || null, viewer: (await this.viewerOf(email))?._id ?? null })))
  }

  async renewToken(email: string) {
    this.logger.log(`RenewToken "${email}"`)
    const guest = await this.guestModel.findOneAndUpdate({ email }, { wrapped_token: crypto.randomBytes(18).toString('base64url') }, { new: true }).lean()

    if (!guest) {
      throw new NotFoundException()
    }

    return { email, wrapped_token: guest.wrapped_token }
  }

  async revokeToken(email: string) {
    this.logger.log(`RevokeToken "${email}"`)
    await this.guestModel.updateOne({ email }, { $unset: { wrapped_token: 1 } })
    return { email, wrapped_token: null }
  }
}
