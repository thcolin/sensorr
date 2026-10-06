import { useMemo } from 'react'
import { useAPI } from './api'

// `Picture` appends the size to the query
export const artworkOf = (path: string | null, fallback: string | null, token: string) => path
  ? `/api/plex/image?${new URLSearchParams({ path, ...(fallback ? { fallback } : {}), authorization: `Bearer ${token}` })}`
  : fallback

const isArtworked = (entity) => [entity?.poster_path, entity?.backdrop_path].some((path) => typeof path === 'string' && path.startsWith('/api/'))

// A movie drawn inside another one's metadata context goes through twice: its TMDB paths are gone by then
// `pending` while the source is unknown: a TMDB image drawn first would be downloaded, then swapped
export const withPlexArtworks = (entity, details, artworks, token, pending = false) => {
  if (pending && !isArtworked(entity)) {
    return {
      entity: entity && { ...entity, poster_path: null, backdrop_path: null },
      details: details && { ...details, poster: null, billboard: null },
      // Its pictures are unknown, not missing: the card waits for them
      pending: true,
    }
  }

  if ((!artworks?.poster && !artworks?.backdrop) || isArtworked(entity)) {
    return { entity, details }
  }

  const poster_path = artworkOf(artworks.poster, entity?.poster_path, token)
  const backdrop_path = artworkOf(artworks.backdrop, entity?.backdrop_path, token)

  return {
    entity: { ...entity, poster_path, backdrop_path },
    details: details && { ...details, poster: poster_path, billboard: backdrop_path },
  }
}

export const usePlexArtworks = (entity, details, artworks, pending = false) => {
  const api = useAPI()
  return useMemo(() => withPlexArtworks(entity, details, artworks, api.access_token, pending), [entity, details, artworks, pending, api.access_token])
}
