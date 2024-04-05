export class SubscriptionDTO {
  _id: number

  readonly endpoint: string
  readonly expirationTime?: number
  readonly keys: {
    auth: string
    p256dh: string
  }
}
