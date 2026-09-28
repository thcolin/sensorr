// Item artworks only: the route must not open the rest of the Plex API to the token it adds
const ARTWORK = /^\/library\/metadata\/\d+\/(thumb|art|clearLogo)\/\d+$/
const TMDB = /^\/[\w-]+\.(jpg|jpeg|png|svg)$/
const SIZE = /^(w\d{2,4}|original)$/

export interface PlexArtworks {
  poster: string | null
  backdrop: string | null
  logo: string | null
}

export interface ImageRequest {
  path: string
  size: string
  fallback: string | null
}

export const imageRequestOf = ({ path, size = 'original', fallback = null }: Record<string, string>): ImageRequest | null => (
  ARTWORK.test(path || '') && SIZE.test(size) && (!fallback || TMDB.test(fallback)) ? { path, size, fallback } : null
)

// An artwork uploaded to Plex keeps its size, 3840 wide for some: `original` stops where TMDB's usually does
const ORIGINAL = 1920

// Plex fits the artwork in the box and keeps its ratio, the height only has to be out of the way
export const transcodeOf = ({ path, size }: ImageRequest) => {
  const width = size === 'original' ? ORIGINAL : Number(size.slice(1))
  return `/photo/:/transcode?${new URLSearchParams({ url: path, width: `${width}`, height: `${width * 4}`, minSize: '0', upscale: '0' })}`
}

export const fallbackOf = ({ size, fallback }: ImageRequest) => fallback ? `https://image.tmdb.org/t/p/${size}${fallback}` : null
