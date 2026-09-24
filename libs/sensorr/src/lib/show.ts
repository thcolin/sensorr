import { episodeStatus } from './episode'

export type Coverage = { season: number, episode: number }

export type ShowUnit = {
  type: 'series' | 'season' | 'episode',
  season?: number,
  episode?: number,
  episodes: Coverage[],
  fallback?: boolean,
}

type ShowEpisode = {
  season_number: number,
  episode_number: number,
  air_date?: string | Date | null,
  monitored?: boolean,
  files?: any[],
  release?: string | null,
}

const DAY = 24 * 60 * 60 * 1000
const ENDED = ['Ended', 'Canceled']

export const isTvCategory = (category) => [].concat(category ?? []).some(value => Math.floor(Number(value) / 1000) === 5)

// A multi-season pack counts as the whole series, and a movie COLLECTION too once the indexer files it under TV
export const levelOf = (meta, category = []): ShowUnit['type'] | null => {
  const seasons = meta?.seasons || []

  if (meta?.type === 'tvshow') {
    if (meta.episodes?.length) {
      return seasons.length === 1 ? 'episode' : null
    }

    if (seasons.length) {
      return seasons.length > 1 ? 'series' : 'season'
    }

    return meta.flags?.includes('COMPLETE') ? 'series' : null
  }

  return (meta?.flags?.includes('COLLECTION') && isTvCategory(category)) ? 'series' : null
}

export const matchesUnit = (meta, category, unit: ShowUnit) => {
  const level = levelOf(meta, category)

  switch (unit.type) {
    case 'series':
      return level === 'series'
    case 'season':
      return level === 'season' && meta.seasons[0] === unit.season
    case 'episode':
      return level === 'episode' && meta.seasons[0] === unit.season && meta.episodes.includes(unit.episode)
  }
}

export const unitLabel = (unit: ShowUnit) => unit.type === 'series' ? 'whole series' : [
  `S${String(unit.season).padStart(2, '0')}`,
  unit.type === 'episode' ? `E${String(unit.episode).padStart(2, '0')}` : ' pack',
].join('')

// `show` is not read yet: every episode a release can cover is in `episodes`
export const coverageOf = (meta, show, episodes: ShowEpisode[]): Coverage[] => {
  const seasons = meta?.seasons || []
  const numbers = meta?.episodes || []
  const whole = !seasons.length && !numbers.length && (meta?.flags || []).some(flag => ['COMPLETE', 'COLLECTION'].includes(flag))

  return episodes
    .filter(({ season_number, episode_number }) => {
      if (whole) {
        return season_number !== 0
      }

      if (numbers.length) {
        return seasons.length === 1 && season_number === seasons[0] && numbers.includes(episode_number)
      }

      return seasons.includes(season_number)
    })
    .map(({ season_number, episode_number }) => ({ season: season_number, episode: episode_number }))
}

export const searchUnits = (show: { status?: string }, episodes: ShowEpisode[], now: Date | number = Date.now()): ShowUnit[] => {
  const targets = (list: ShowEpisode[]) => list.map(({ season_number, episode_number }) => ({ season: season_number, episode: episode_number }))
  const aired = (list: ShowEpisode[]) => list.length > 0 && list.every(({ air_date }) => air_date && new Date(air_date).getTime() <= new Date(now).getTime() - DAY)
  const owned = (list: ShowEpisode[]) => list.some(({ monitored, files }) => monitored && files?.length)
  const ofSeason = (list: ShowEpisode[], season: number) => list.filter(({ season_number }) => season_number === season)

  const wanted = episodes
    .filter(episode => episodeStatus(episode, now) === 'wanted')
    .sort((a, b) => (a.season_number - b.season_number) || (a.episode_number - b.episode_number))
  const regular = episodes.filter(({ season_number }) => season_number !== 0)
  const packable = [...new Set(wanted.map(({ season_number }) => season_number))]
    .filter(season => season !== 0 && aired(ofSeason(episodes, season)))
  const pack = (season: number, fallback = false): ShowUnit => ({
    type: 'season',
    season,
    episodes: targets(ofSeason(wanted, season)),
    ...(fallback ? { fallback } : {}),
  })
  const series = wanted.filter(({ season_number }) => season_number !== 0)

  return [
    ...((ENDED.includes(show?.status) && series.length && aired(regular) && !owned(regular)) ? [{ type: 'series', episodes: targets(series) } as ShowUnit] : []),
    ...packable.filter(season => !owned(ofSeason(episodes, season))).map(season => pack(season)),
    ...wanted.map(episode => ({ type: 'episode', season: episode.season_number, episode: episode.episode_number, episodes: targets([episode]) } as ShowUnit)),
    ...packable.filter(season => owned(ofSeason(episodes, season))).map(season => pack(season, true)),
  ]
}

// Each release keeps as coverage only the episodes it is the first to cover
export const pickReleases = (unitsWithResults: { unit: ShowUnit, results: any[] }[], episodes: ShowEpisode[]) => {
  const keyOf = ({ season, episode }: Coverage) => `${season}:${episode}`
  const wanted = new Set(unitsWithResults.flatMap(({ unit }) => unit.episodes.map(keyOf)))
  const found = new Set<number>()
  const picked = []

  for (const { unit, results } of unitsWithResults) {
    if (unit.fallback && found.has(unit.season)) {
      continue
    }

    const release = (results || []).find(({ valid }) => valid)
    const coverage = release ? coverageOf(release.meta, null, episodes).filter(covered => wanted.has(keyOf(covered))) : []

    if (!coverage.length) {
      continue
    }

    coverage.forEach(covered => wanted.delete(keyOf(covered)))

    if (unit.type === 'episode') {
      found.add(unit.season)
    }

    picked.push({ ...release, coverage })
  }

  return picked
}
