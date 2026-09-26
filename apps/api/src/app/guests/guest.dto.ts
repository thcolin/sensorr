export class GuestDTO {
  _id: number

  readonly email: string
  readonly name: string
  readonly avatar: string
  readonly plex_id: string
  readonly plex_token: string
  readonly plex_token_valid: boolean
  readonly plex_token_checked_at: number
}
