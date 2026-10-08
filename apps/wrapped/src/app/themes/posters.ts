import type { WrappedPoster } from '@sensorr/sensorr'

// Every title of the year with a poster, once: what a look's cover rolls behind its front
export const postersOf = (value: unknown, found = new Map<string, WrappedPoster>()) => {
  if (Array.isArray(value)) {
    value.forEach((item) => postersOf(item, found))
  } else if (value && typeof value === 'object') {
    const poster = value as WrappedPoster
    typeof poster.key === 'string' && poster.thumb && !found.has(poster.key) && found.set(poster.key, poster)
    Object.values(value).forEach((item) => postersOf(item, found))
  }

  return [...found.values()]
}
