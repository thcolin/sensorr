import type { PlexArtworkKind } from '@sensorr/plex'

export type ArtworkKind = PlexArtworkKind

export type ArtworkChoice = { key: string } | { url: string }

export interface Candidate {
  id: string
  thumb: string
  choice: ArtworkChoice
  lang: string | null
  source: string
  current: boolean
}

export interface CandidateGroup {
  label: string
  items: Candidate[]
}

const TMDB = /^https:\/\/image\.tmdb\.org\/t\/p\/original(\/[\w-]+\.\w+)$/

export const ratingKeyOf = (artworks) => [artworks?.poster, artworks?.backdrop, artworks?.logo]
  .map((path) => typeof path === 'string' && path.match(/^\/library\/metadata\/(\d+)\//)?.[1])
  .find(Boolean) || null

const plexThumbOf = (thumb: string, token: string) => thumb.startsWith('/library/metadata/')
  ? `/api/plex/image?${new URLSearchParams({ path: thumb, authorization: `Bearer ${token}` })}`
  : thumb

// TMDB images Plex already lists are picked back through Plex, the others are fetched by Plex
export const candidatesOf = (plex = [], tmdb = [], { region, token }: { region: string, token: string }): CandidateGroup[] => {
  const langs = new Map(tmdb.map(({ file_path, iso_639_1 }) => [file_path, iso_639_1 || null]))
  const listed = new Set<string>()

  const fromPlex: Candidate[] = plex.map(({ key, thumb, provider, selected }) => {
    const path = key.match(TMDB)?.[1]

    if (path) {
      listed.add(path)
    }

    return {
      id: key,
      thumb: path || plexThumbOf(thumb, token),
      choice: { key },
      lang: path ? langs.get(path) ?? null : null,
      source: provider,
      current: selected,
    }
  })

  const fromTMDB: Candidate[] = tmdb.filter(({ file_path }) => !listed.has(file_path)).map(({ file_path, iso_639_1 }) => ({
    id: file_path,
    thumb: file_path,
    choice: { url: `https://image.tmdb.org/t/p/original${file_path}` },
    lang: iso_639_1 || null,
    source: 'tmdb',
    current: false,
  }))

  const all = [...fromPlex, ...fromTMDB]
  const rest = all.filter(({ current }) => !current)

  return [
    { label: 'current', items: all.filter(({ current }) => current) },
    { label: region, items: rest.filter(({ lang }) => lang === region) },
    { label: 'en', items: region === 'en' ? [] : rest.filter(({ lang }) => lang === 'en') },
    { label: 'others', items: rest.filter(({ lang }) => lang !== region && lang !== 'en') },
  ].filter(({ items }) => items.length)
}

export const setCandidatesOf = (sets = [], kind: ArtworkKind): Candidate[] => sets
  .filter((set) => set[kind])
  .map((set) => ({
    id: `mediux:${set.id}:${kind}`,
    thumb: set[kind].thumb,
    choice: { url: set[kind].url },
    lang: null,
    source: 'mediux',
    current: false,
  }))

export const linkOf = (raw: string): string | null => {
  const value = raw.trim()
  const poster = value.match(/^https?:\/\/(www\.)?theposterdb\.com\/posters?\/(\d+)/)

  if (poster) {
    return `https://theposterdb.com/api/assets/${poster[2]}`
  }

  return /^https?:\/\/\S+$/.test(value) ? value : null
}
