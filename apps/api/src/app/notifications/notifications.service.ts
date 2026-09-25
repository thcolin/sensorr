import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { defer, from, fromEventPattern, merge, Observable } from 'rxjs'
import { catchError, finalize, map, mergeMap, share, tap } from 'rxjs/operators'
import webpush from 'web-push'
import { Log as LogDocument } from '../logs/log.schema'
import { SubscriptionDTO } from './subscription.dto'
import { Subscription as SubscriptionDocument } from './subscription.schema'
import { pushOf } from './push'

// The logs that notify, read as they are for the history, unseen for the badge count, and under `fullDocument.` for the change stream
const NOTIFYING = [
  { "meta.command": "record", "meta.release.valid": true, "meta.movie.id": { $exists: true } },
  { "meta.command": "refine", "meta.release.valid": true, "meta.movie.id": { $exists: true } },
  { "meta.command": "shrink", "meta.release.valid": true, "meta.movie.id": { $exists: true } },
  { "meta.command": "report", "meta.release.valid": true, "meta.movie.id": { $exists: true } },
  { "meta.command": "sync", "meta.group": "missings", "meta.movie.id": { $exists: true } },
  { "meta.command": "keep-in-touch", "meta.processed": true, "meta.movie.id": { $exists: true } },
  { "meta.command": "record", "meta.type": "show", "meta.release.valid": true, "meta.show.id": { $exists: true } },
  { "meta.command": "airing", "meta.type": "show", "meta.release.valid": true, "meta.show.id": { $exists: true } },
  { "meta.command": "sync", "meta.type": "show", "meta.group": "missings", "meta.missing": { $gt: 0 }, "meta.show.id": { $exists: true } },
  { "meta.command": "keep-in-touch", "meta.type": "show", "meta.processed": true, "meta.show.id": { $exists: true } },
]

const prefixWith = (prefix: string) => (filter: { [key: string]: any }) => Object.fromEntries(Object.entries(filter).map(([key, value]) => [`${prefix}${key}`, value]))

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name)

  private readonly changes$: Observable<any> = defer(() => {
    this.logger.log('Changes, opened')
    const stream = this.logModel.watch([{ $match: { operationType: 'insert', $or: NOTIFYING.map(prefixWith('fullDocument.')) } }])

    return fromEventPattern(
      (handler) => stream.on('change', handler),
      (handler) => stream.removeListener('change', handler),
    ).pipe(
      finalize(() => {
        this.logger.log('Changes, closed')
        stream.close()
      }),
    )
  }).pipe(share())

  constructor(
    @InjectModel(LogDocument.name) private readonly logModel: Model<LogDocument>,
    @InjectModel(SubscriptionDocument.name) private readonly subscriptionModel: Model<SubscriptionDocument>,
  ) {}

  listenNotifications(history = true): Observable<MessageEvent> {
    this.logger.log('ListenNotifications')

    return merge(...[
      ...(history ? [
        from(this.logModel.find({ $or: NOTIFYING }).sort({ timestamp: -1 }).lean().exec()).pipe(
          map(data => ({ data } as MessageEvent)),
        ),
      ] : []),
      this.changes$.pipe(
        map(({ fullDocument: data }) => ({ data } as MessageEvent)),
        tap(() => this.logger.log(`ListenNotifications, message=""`)),
      )
    ])
  }

  async subscribeNotifications(subscription: SubscriptionDTO) {
    this.logger.log(`SubscribeNotifications "${subscription.endpoint}"`)
    return this.subscriptionModel.create(subscription)
  }

  async deleteNotificationsSubscription(subscription: SubscriptionDTO) {
    this.logger.log(`SubscribeNotifications "${subscription.endpoint}"`)
    return this.subscriptionModel.findOneAndDelete({ endpoint: subscription.endpoint })
  }

  async dispatchWebPushNotifications() {
    if (!process.env.NX_SENSORR_VAPID_PUBLIC_KEY) {
      this.logger.log(`DispatchWebPushNotifications (disabled)`)
      return
    }

    this.logger.log(`DispatchWebPushNotifications (enabled)`)
    webpush.setVapidDetails(
      process.env.NX_SENSORR_VAPID_SUBJECT || 'mailto:noreply@sensorr.dev',
      process.env.NX_SENSORR_VAPID_PUBLIC_KEY,
      process.env.NX_SENSORR_VAPID_PRIVATE_KEY
    )

    this.listenNotifications(false)
      .pipe(
        map(({ data: { meta } }) => pushOf(meta)),
        mergeMap(notification => from(this.logModel.find({
          $or: NOTIFYING.map(filter => ({ ...filter, "meta.seen": { $exists: false } })),
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
                  return Promise.resolve(true)
                  // return this.subscriptionModel.findOneAndDelete({ endpoint: subscription.endpoint })
                }),
              )
            }),
          )),
        )),
      )
      .subscribe()
  }
}
