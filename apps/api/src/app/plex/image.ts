// The only paths the image route reads on Plex: an artwork of an item, as `sync` stores it
const ARTWORK = /^\/library\/metadata\/\d+\/(thumb|art|clearLogo)\/\d+$/
const TMDB = /^\/[\w-]+\.(jpg|jpeg|png|svg)$/
const SIZE = /^(w\d{2,4}|original)$/

export interface ImageRequest {
  path: string
  size: string
  fallback: string | null
}

export const imageRequestOf = ({ path, size = 'original', fallback = null }: Record<string, string>): ImageRequest | null => (
  ARTWORK.test(path || '') && SIZE.test(size) && (!fallback || TMDB.test(fallback)) ? { path, size, fallback } : null
)

// Plex fits the artwork in the box and keeps its ratio, the height only has to be out of the way
export const transcodeOf = ({ path, size }: ImageRequest) => size === 'original'
  ? path
  : `/photo/:/transcode?${new URLSearchParams({ url: path, width: size.slice(1), height: `${Number(size.slice(1)) * 4}`, minSize: '0', upscale: '0' })}`

export const fallbackOf = ({ size, fallback }: ImageRequest) => fallback ? `https://image.tmdb.org/t/p/${size}${fallback}` : null
