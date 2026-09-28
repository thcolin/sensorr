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

// What Plex calls each kind: the list it offers, and the one it shows
export const PLEX_ARTWORKS: { [kind in PlexArtworkKind]: { list: string, one: string } } = {
  poster: { list: 'posters', one: 'poster' },
  backdrop: { list: 'arts', one: 'art' },
  logo: { list: 'clearLogos', one: 'clearLogo' },
}

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
