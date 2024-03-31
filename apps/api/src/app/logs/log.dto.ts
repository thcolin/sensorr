export class LogDTO {
  _id: string

  readonly timestamp: Date
  readonly level: string
  readonly message: string
  readonly meta: { [key: string]: any }
}
