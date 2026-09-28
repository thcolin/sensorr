import { useMemo } from 'react'
import { useAPI } from './api'

// `Picture` appends the size to the query
const artworkOf = (path: string | null, fallback: string | null, token: string) => path
  ? `/api/plex/image?${new URLSearchParams({ path, ...(fallback ? { fallback } : {}), authorization: `Bearer ${token}` })}`
  : fallback

export const withPlexArtworks = (entity, details, artworks, token) => {
  if (!artworks?.poster && !artworks?.backdrop) {
    return { entity, details }
  }

  const poster_path = artworkOf(artworks.poster, entity?.poster_path, token)
  const backdrop_path = artworkOf(artworks.backdrop, entity?.backdrop_path, token)

  return {
    entity: { ...entity, poster_path, backdrop_path },
    details: details && { ...details, poster: poster_path, billboard: backdrop_path },
  }
}

export const usePlexArtworks = (entity, details, artworks) => {
  const api = useAPI()
  return useMemo(() => withPlexArtworks(entity, details, artworks, api.access_token), [entity, details, artworks])
}
