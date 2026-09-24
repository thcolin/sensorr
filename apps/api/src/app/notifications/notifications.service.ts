import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { from, merge, Observable } from 'rxjs'
import { catchError, filter, map, mergeMap, tap } from 'rxjs/operators'
import webpush from 'web-push'
import { Log as LogDocument } from '../logs/log.schema'
import { LogsService } from '../logs/logs.service'
import { SubscriptionDTO } from './subscription.dto'
import { Subscription as SubscriptionDocument } from './subscription.schema'
import { pushOf } from './push'

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name)

  constructor(
    @InjectModel(LogDocument.name) private readonly logModel: Model<LogDocument>,
    @InjectModel(SubscriptionDocument.name) private readonly subscriptionModel: Model<SubscriptionDocument>,
    private logsService: LogsService,
  ) {}

  listenNotifications(history = true): Observable<MessageEvent> {
    this.logger.log('ListenNotifications')

    return merge(...[
      ...(history ? [
        from(this.logModel.find({
          $or: [
            { "meta.command": "record", "meta.release.valid": true, "meta.movie.id": { $exists: true } },
            { "meta.command": "refine", "meta.release.valid": true, "meta.movie.id": { $exists: true } },
            { "meta.command": "shrink", "meta.release.valid": true, "meta.movie.id": { $exists: true } },
            { "meta.command": "report", "meta.release.valid": true, "meta.movie.id": { $exists: true } },
            { "meta.command": "sync", "meta.group": "missings", "meta.movie.id": { $exists: true } },
            { "meta.command": "keep-in-touch", "meta.processed": true, "meta.movie.id": { $exists: true } },
            { "meta.command": "record-shows", "meta.release.valid": true, "meta.show.id": { $exists: true } },
            { "meta.command": "airing", "meta.release.valid": true, "meta.show.id": { $exists: true } },
            { "meta.command": "keep-in-touch", "meta.processed": true, "meta.show.id": { $exists: true } },
          ]
        }).sort({ timestamp: -1 }).lean().exec()).pipe(
          map(data => ({ data } as MessageEvent)),
        ),
      ] : []),
      this.logsService.changes$.pipe(
        filter((change: any) => change?.ns?.coll === 'log' && change.operationType === 'insert' && (
          (change.fullDocument?.meta?.command === 'record' && change.fullDocument?.meta?.release?.valid && change.fullDocument?.meta?.movie?.id) ||
          (change.fullDocument?.meta?.command === 'refine' && change.fullDocument?.meta?.release?.valid && change.fullDocument?.meta?.movie?.id) ||
          (change.fullDocument?.meta?.command === 'shrink' && change.fullDocument?.meta?.release?.valid && change.fullDocument?.meta?.movie?.id) ||
          (change.fullDocument?.meta?.command === 'report' && change.fullDocument?.meta?.release?.valid && change.fullDocument?.meta?.movie?.id) ||
          (change.fullDocument?.meta?.command === 'sync' && change.fullDocument?.meta?.group === 'missings' && change.fullDocument?.meta?.movie?.id) ||
          (change.fullDocument?.meta?.command === 'keep-in-touch' && change.fullDocument?.meta?.processed && change.fullDocument?.meta?.movie?.id) ||
          (change.fullDocument?.meta?.command === 'record-shows' && change.fullDocument?.meta?.release?.valid && change.fullDocument?.meta?.show?.id) ||
          (change.fullDocument?.meta?.command === 'airing' && change.fullDocument?.meta?.release?.valid && change.fullDocument?.meta?.show?.id) ||
          (change.fullDocument?.meta?.command === 'keep-in-touch' && change.fullDocument?.meta?.processed && change.fullDocument?.meta?.show?.id)
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
          $or: [
            { "meta.command": "record", "meta.release.valid": true, "meta.movie.id": { $exists: true }, "meta.seen": { $exists: false } },
            { "meta.command": "refine", "meta.release.valid": true, "meta.movie.id": { $exists: true }, "meta.seen": { $exists: false } },
            { "meta.command": "shrink", "meta.release.valid": true, "meta.movie.id": { $exists: true }, "meta.seen": { $exists: false } },
            { "meta.command": "report", "meta.release.valid": true, "meta.movie.id": { $exists: true }, "meta.seen": { $exists: false } },
            { "meta.command": "sync", "meta.group": "missings", "meta.movie.id": { $exists: true }, "meta.seen": { $exists: false } },
            { "meta.command": "keep-in-touch", "meta.processed": true, "meta.movie.id": { $exists: true }, "meta.seen": { $exists: false } },
            { "meta.command": "record-shows", "meta.release.valid": true, "meta.show.id": { $exists: true }, "meta.seen": { $exists: false } },
            { "meta.command": "airing", "meta.release.valid": true, "meta.show.id": { $exists: true }, "meta.seen": { $exists: false } },
            { "meta.command": "keep-in-touch", "meta.processed": true, "meta.show.id": { $exists: true }, "meta.seen": { $exists: false } },
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
