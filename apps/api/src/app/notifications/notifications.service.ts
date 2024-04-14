import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { from, fromEventPattern, merge, Observable } from 'rxjs'
import { catchError, filter, map, mergeMap, tap } from 'rxjs/operators'
import webpush from 'web-push'
// import { filesize } from '@sensorr/utils'
import { Log as LogDocument } from '../logs/log.schema'
import { SubscriptionDTO } from './subscription.dto'
import { Subscription as SubscriptionDocument } from './subscription.schema'

const units = ['B', 'KB', 'MB', 'GB', 'TB']
const filesize = {
  stringify: (bytes, unit = true) => {
    const exponent = bytes == 0 ? 0 : Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, exponent)).toFixed(2) as any * 1} ${unit ? units[exponent] : ''}`
  },
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name)

  constructor(
    @InjectModel(LogDocument.name) private readonly logModel: Model<LogDocument>,
    @InjectModel(SubscriptionDocument.name) private readonly subscriptionModel: Model<SubscriptionDocument>,
  ) {}

  listenNotifications(history = true): Observable<MessageEvent> {
    this.logger.log('ListenNotifications')
    const stream = this.logModel.watch()

    return merge(...[
      ...(history ? [
        from(this.logModel.find({
          $or: [
            { "meta.command": "record", "meta.release.valid": true, "meta.movie.id": { $exists: true } },
            { "meta.command": "doctor", "meta.release.valid": true, "meta.movie.id": { $exists: true } },
            { "meta.command": "sync", "meta.group": "missings", "meta.movie.id": { $exists: true } },
            { "meta.command": "keep-in-touch", "meta.processed": true, "meta.movie.id": { $exists: true } },
          ]
        }).sort({ timestamp: -1 }).lean().exec()).pipe(
          map(data => ({ data } as MessageEvent)),
        ),
      ] : []),
      fromEventPattern(
        (handler) => stream.on('change', handler),
        (handler) => {
          this.logger.log('ListenNotifications, closed')
          stream.removeListener('change', handler)
          stream.close()
        },
      ).pipe(
        filter((change: any) => change?.ns?.coll === 'log' && change.operationType === 'insert' && (
          (change.fullDocument?.meta?.command === 'record' && change.fullDocument?.meta?.release?.valid && change.fullDocument?.meta?.movie?.id) ||
          (change.fullDocument?.meta?.command === 'doctor' && change.fullDocument?.meta?.release?.valid && change.fullDocument?.meta?.movie?.id) ||
          (change.fullDocument?.meta?.command === 'sync' && change.fullDocument?.meta?.group === 'missings' && change.fullDocument?.meta?.movie?.id) ||
          (change.fullDocument?.meta?.command === 'keep-in-touch' && change.fullDocument?.meta?.processed && change.fullDocument?.meta?.movie?.id)
        )),
        map(({ fullDocument: data }) => ({ data } as MessageEvent)),
        tap(() => this.logger.log(`ListenNotifications, message=""`)),
      )
    ])
  }

  async subscribeNotifications(subscription: SubscriptionDTO) {
    this.logger.log(`SubscribeNotifications "${subscription.endpoint}"`)
    return this.subscriptionModel.create(subscription)
  }

  async dispatchWebPushNotifications() {
    if (!process.env.NX_SENSORR_VAPID_PUBLIC_KEY) {
      this.logger.log(`DispatchWebPushNotifications (disabled)`)
      return
    }

    this.logger.log(`DispatchWebPushNotifications (enabled)`)
    webpush.setVapidDetails(
      process.env.NX_SENSORR_VAPID_SUBJECT,
      process.env.NX_SENSORR_VAPID_PUBLIC_KEY,
      process.env.NX_SENSORR_VAPID_PRIVATE_KEY
    )

    this.listenNotifications(false)
      .pipe(
        map(({ data: { meta } }) => ({
          title: `${meta?.movie?.title}${meta?.movie?.release_date ? ` (${(new Date(meta?.movie?.release_date)).getFullYear()})` : ''}`,
          body: {
            'record': meta?.release?.proposal ? `📹 Record proposal (${meta?.release?.znab}, ${filesize.stringify(meta?.release?.size || 0)}, ${meta?.release?.peers} peers)\n${meta?.release?.title}` : `📹 Recorded (${meta?.release?.znab}, ${filesize.stringify(meta?.release?.size || 0)}, ${meta?.release?.peers} peers)\n${meta?.release?.title}`,
            'doctor': meta?.release?.proposal ? `🚑 Keep up to date proposal (${meta?.release?.znab}, ${filesize.stringify(meta?.release?.size || 0)}, ${meta?.release?.peers} peers)\n${meta?.release?.title}` : `🚑 Keeped up to date (${meta?.release?.znab}, ${filesize.stringify(meta?.release?.size || 0)}, ${meta?.release?.peers} peers)\n${meta?.release?.title}`,
            'sync': `💊 Missing from your Plex Server`,
            'keep-in-touch': `🍺 Requested by ${(meta?.requested_by || []).join(', ')}`,
          }[meta?.command],
          image: `https://image.tmdb.org/t/p/w185${meta?.movie?.poster_path}`,
          actions: {
            'record': [
              { action: 'accept', title: 'Accept' },
              { action: 'refuse', title: 'Refuse' },
            ],
            'doctor': [
              { action: 'accept', title: 'Accept' },
              { action: 'refuse', title: 'Refuse' },
            ],
            'sync': [
              { action: 'wish-it-back', title: '"Wish" it back' },
              { action: 'ignore', title: 'Ignore' },
            ],
            'keep-in-touch': [
              { action: 'wish-it', title: '"Wish" it' },
              { action: 'ignore', title: 'Ignore' },
            ],
          }[meta?.command],
        })),
        mergeMap(notification => from(this.logModel.find({
          $or: [
            { "meta.command": "record", "meta.release.valid": true, "meta.movie.id": { $exists: true }, "meta.seen": { $exists: false } },
            { "meta.command": "doctor", "meta.release.valid": true, "meta.movie.id": { $exists: true }, "meta.seen": { $exists: false } },
            { "meta.command": "sync", "meta.group": "missings", "meta.movie.id": { $exists: true }, "meta.seen": { $exists: false } },
            { "meta.command": "keep-in-touch", "meta.processed": true, "meta.movie.id": { $exists: true }, "meta.seen": { $exists: false } },
          ]
        }).lean().exec()).pipe(
          map(unread => ({ notification, unread: unread.length })),
        )),
        mergeMap(data => from(this.subscriptionModel.find().lean().exec()).pipe(
          mergeMap(subscriptions => from(subscriptions).pipe(
            mergeMap(subscription => {
              this.logger.log(`DispatchWebPushNotification "${data.notification.title}", subscription="${subscription.endpoint}"`)
              return from(webpush.sendNotification(subscription, JSON.stringify(data))).pipe(
                catchError((err) => {
                  this.logger.error(`${err}, endpoint=${subscription.endpoint}`)
                  return this.subscriptionModel.findOneAndDelete({ endpoint: subscription.endpoint })
                }),
              )
            }),
          )),
        )),
      )
      .subscribe()
  }
}
