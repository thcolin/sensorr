import { useMemo } from 'react'
import { useAPI } from './api'

// An artwork picked on Plex, served by the API with the TMDB one as fallback; `Picture` adds the size
const artworkOf = (path: string | null, fallback: string | null, token: string) => path
  ? `/api/plex/image?${new URLSearchParams({ path, ...(fallback ? { fallback } : {}), authorization: `Bearer ${token}` })}`
  : fallback

// The poster and backdrop of a movie or a show Plex has, over the TMDB ones of `entity` and its `details`
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
