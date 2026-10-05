// Item artworks only: the route must not open the rest of the Plex API to the token it adds
const ARTWORK = /^\/library\/metadata\/\d+\/(thumb|art|clearLogo)\/\d+$/
const FILE = /^\/library\/metadata\/\d+\/file\?url=([^&]+)$/
// Decoded once: no segment starting with a dot, so no `..`, and nothing left encoded twice
const LOCAL = /^(metadata|upload|media):\/\/[\w-][\w.-]*(\/[\w-][\w.-]*)*$/

const artworkOf = (path: string) => {
  if (ARTWORK.test(path)) {
    return true
  }

  const [, raw] = path.match(FILE) || []

  try {
    const url = raw && decodeURIComponent(raw)
    return !!url && !url.includes('%') && LOCAL.test(url)
  } catch {
    return false
  }
}
export const TMDB = /^\/[\w-]+\.(jpg|jpeg|png|svg)$/
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

  return artworkOf(path) && SIZE.test(size) && (!fallback || TMDB.test(fallback as string)) ? { path, size, fallback: fallback as string | null } : null
}

// An artwork uploaded to Plex keeps its size, 3840 wide for some: `original` stops where TMDB's usually does
const ORIGINAL = 1920

// Plex fits the artwork in the box and keeps its ratio, the height only has to be out of the way
// A logo keeps its transparency in PNG, which Plex otherwise serves under a JPEG type
export const transcodeOf = ({ path, size }: ImageRequest) => {
  const width = size === 'original' ? ORIGINAL : Number(size.slice(1))
  const format = /clearLogos?/.test(path) ? { format: 'png' } : {}
  return `/photo/:/transcode?${new URLSearchParams({ url: path, width: `${width}`, height: `${width * 4}`, minSize: '0', upscale: '0', ...format })}`
}

export const fallbackOf = ({ size, fallback }: ImageRequest) => fallback ? `https://image.tmdb.org/t/p/${size}${fallback}` : null
