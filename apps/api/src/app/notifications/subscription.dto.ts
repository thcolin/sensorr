export class SubscriptionDTO {
  readonly endpoint: string
  readonly expirationTime?: number
  readonly keys: {
    auth: string
    p256dh: string
  }
}
