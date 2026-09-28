// Item artworks only: the route must not open the rest of the Plex API to the token it adds
const ARTWORK = /^\/library\/metadata\/\d+\/((thumb|art|clearLogo)\/\d+|file\?url=(metadata|upload|media)%3A%2F%2F[\w%.-]+)$/
const TMDB = /^\/[\w-]+\.(jpg|jpeg|png|svg)$/
// The sizes `Picture` asks for: each other width would be one more transcode kept by Plex
const SIZE = /^(w92|w154|w185|w300|w342|w500|w780|original)$/

export interface ImageRequest {
  path: string
  size: string
  fallback: string | null
}

// A repeated or bracketed query parameter is an array, which a regular expression would read as a string
export const imageRequestOf = ({ path, size = 'original', fallback = null }: Record<string, unknown>): ImageRequest | null => {
  if (typeof path !== 'string' || typeof size !== 'string' || (fallback !== null && typeof fallback !== 'string')) {
    return null
  }

  return ARTWORK.test(path) && SIZE.test(size) && (!fallback || TMDB.test(fallback as string)) ? { path, size, fallback: fallback as string | null } : null
}

// An artwork uploaded to Plex keeps its size, 3840 wide for some: `original` stops where TMDB's usually does
const ORIGINAL = 1920

// Plex fits the artwork in the box and keeps its ratio, the height only has to be out of the way
export const transcodeOf = ({ path, size }: ImageRequest) => {
  const width = size === 'original' ? ORIGINAL : Number(size.slice(1))
  return `/photo/:/transcode?${new URLSearchParams({ url: path, width: `${width}`, height: `${width * 4}`, minSize: '0', upscale: '0' })}`
}

export const fallbackOf = ({ size, fallback }: ImageRequest) => fallback ? `https://image.tmdb.org/t/p/${size}${fallback}` : null
