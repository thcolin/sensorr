export interface PlexArtworks {
  poster: string | null
  backdrop: string | null
  logo: string | null
}

export type PlexArtworkKind = keyof PlexArtworks

export interface PlexArtworkCandidate {
  key: string
  thumb: string
  provider: string
  selected: boolean
}

const ARTWORKS = { coverPoster: 'poster', background: 'backdrop', clearLogo: 'logo' }

export const artworksOf = (payload): PlexArtworks => (payload.Image || []).reduce(
  (acc, { type, url }) => ARTWORKS[type] ? { ...acc, [ARTWORKS[type]]: url } : acc,
  { poster: payload.thumb || null, backdrop: payload.art || null, logo: null },
)

export const sameArtworks = (known: Partial<PlexArtworks> | null | undefined, artworks: PlexArtworks) => (
  Object.keys(artworks).every((key) => (known?.[key] || null) === artworks[key])
)

// `ratingKey` is what Plex takes back to pick a candidate: a URL, or one of its own `metadata://`, `upload://`, `media://`
export const candidatesOf = (metadata = []): PlexArtworkCandidate[] => metadata.map(({ ratingKey, thumb, provider, selected }) => ({
  key: ratingKey,
  thumb,
  provider: provider || 'local',
  selected: !!selected,
}))

export interface PlexSeason {
  key: string
  poster: string | null
}

// Every season with the Plex item its poster is written to; one without a poster of its own shows the show's, and has none
export const seasonsOf = (seasons = [], ratingKeys: string[]): Record<string, PlexSeason> => seasons
  .filter(({ parentRatingKey }) => ratingKeys.includes(`${parentRatingKey}`))
  .reduce((acc, { index, ratingKey, thumb, parentThumb }) => acc[index] ? acc : {
    ...acc,
    [index]: { key: `${ratingKey}`, poster: thumb && thumb !== parentThumb ? thumb : null },
  }, {})

export const sameSeasons = (known: Record<string, PlexSeason> | null | undefined, seasons: Record<string, PlexSeason>) => {
  const keys = new Set([...Object.keys(known || {}), ...Object.keys(seasons)])
  return [...keys].every((key) => (known?.[key]?.key || null) === (seasons[key]?.key || null) && (known?.[key]?.poster || null) === (seasons[key]?.poster || null))
}
