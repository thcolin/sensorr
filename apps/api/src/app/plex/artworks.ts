import type { PlexArtworkKind } from '@sensorr/plex'

// What Plex calls each kind: the list it offers, and the one it shows
export const PLEX_ARTWORKS: { [kind in PlexArtworkKind]: { list: string, one: string } } = {
  poster: { list: 'posters', one: 'poster' },
  backdrop: { list: 'arts', one: 'art' },
  logo: { list: 'clearLogos', one: 'clearLogo' },
}

// A candidate Plex listed, picked back by its `ratingKey`, or an image Plex has to fetch
export type ArtworkChoice = { key: string } | { url: string }
export type ArtworkChoices = Partial<Record<PlexArtworkKind, ArtworkChoice>>

const RATING_KEY = /^\d+$/
const KEY = /^(https?|metadata|upload|media):\/\/\S+$/
const URL = /^https?:\/\/\S+$/

export const ratingKeyOf = (value: unknown) => typeof value === 'string' && RATING_KEY.test(value) ? value : null

export const artworkChoicesOf = (body: unknown): ArtworkChoices | null => {
  if (!body || typeof body !== 'object') {
    return null
  }

  const choices = Object.entries(body).reduce((acc, [kind, choice]) => {
    if (acc === null || !(kind in PLEX_ARTWORKS) || !choice || typeof choice !== 'object') {
      return null
    }

    const { key, url } = choice as Record<string, unknown>
    return typeof key === 'string' && KEY.test(key) ? { ...acc, [kind]: { key } }
      : typeof url === 'string' && URL.test(url) ? { ...acc, [kind]: { url } }
      : null
  }, {} as ArtworkChoices)

  return choices && Object.keys(choices).length ? choices : null
}

// Picking a listed candidate is a PUT on the one shown, adding an image a POST on the list
export const writeOf = (ratingKey: string, kind: PlexArtworkKind, choice: ArtworkChoice) => 'key' in choice
  ? { method: 'PUT', path: `/library/metadata/${ratingKey}/${PLEX_ARTWORKS[kind].one}?${new URLSearchParams({ url: choice.key })}` }
  : { method: 'POST', path: `/library/metadata/${ratingKey}/${PLEX_ARTWORKS[kind].list}?${new URLSearchParams({ url: choice.url })}` }
