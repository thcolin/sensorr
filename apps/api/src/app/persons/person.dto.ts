export class PersonDTO {
  _id: number

  readonly birthday: Date | null
  readonly known_for_department: string
  readonly deathday: Date | null
  readonly id: number
  readonly name: string
  readonly also_known_as: string[]
  readonly gender: number
  readonly biography: string
  readonly popularity: number
  readonly place_of_birth: string | null
  readonly profile_path: string | null
  readonly adult: boolean
  readonly imdb_id: string | null
  readonly homepage: string | null
  readonly state: string
  readonly updated_at: number
}
