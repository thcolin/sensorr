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
  // A pack downloads its whole scope, so every episode of it must be monitored, and wanted unless it is owned already
  const asked = (list: ShowEpisode[]) => list.every(episode => episode.monitored && ['wanted', 'owned'].includes(episodeStatus(episode, now)))
  const ofSeason = (list: ShowEpisode[], season: number) => list.filter(({ season_number }) => season_number === season)

  const wanted = episodes
    .filter(episode => episodeStatus(episode, now) === 'wanted')
    .sort((a, b) => (a.season_number - b.season_number) || (a.episode_number - b.episode_number))
  const regular = episodes.filter(({ season_number }) => season_number !== 0)
  const packable = [...new Set(wanted.map(({ season_number }) => season_number))]
    .filter(season => season !== 0 && aired(ofSeason(episodes, season)) && asked(ofSeason(episodes, season)))
  const pack = (season: number, fallback = false): ShowUnit => ({
    type: 'season',
    season,
    episodes: targets(ofSeason(wanted, season)),
    ...(fallback ? { fallback } : {}),
  })
  const series = wanted.filter(({ season_number }) => season_number !== 0)

  return [
    ...((ENDED.includes(show?.status) && series.length && aired(regular) && !owned(regular) && asked(regular)) ? [{ type: 'series', episodes: targets(series) } as ShowUnit] : []),
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

// Same rules as pickReleases: a unit is not searched once the picks cover every episode it targets, or, for a last resort pack, any episode of its season
export const isUnitCovered = (unit: ShowUnit, picks: { coverage: Coverage[] }[]) => {
  const covered = picks.flatMap(({ coverage }) => coverage)

  return unit.fallback
    ? covered.some(({ season }) => season === unit.season)
    : unit.episodes.every(({ season, episode }) => covered.some(c => c.season === season && c.episode === episode))
}

// `S01-S10` over several seasons, `S03` for a pack, `S03E04` or `S03E04-E06` for episodes
export const coverageLabel = (coverage: Coverage[], level: ShowUnit['type'] = coverage.length === 1 ? 'episode' : 'season') => {
  const pad = (value: number) => String(value).padStart(2, '0')
  const seasons = [...new Set(coverage.map(({ season }) => season))].sort((a, b) => a - b)
  const episodes = coverage.map(({ episode }) => episode).sort((a, b) => a - b)

  if (!seasons.length) {
    return ''
  }

  if (seasons.length > 1) {
    return `S${pad(seasons[0])}-S${pad(seasons[seasons.length - 1])}`
  }

  if (level !== 'episode') {
    return `S${pad(seasons[0])}`
  }

  const run = episodes.length > 1 && episodes.every((episode, index) => !index || episode === episodes[index - 1] + 1)

  return `S${pad(seasons[0])}${run ? `E${pad(episodes[0])}-E${pad(episodes[episodes.length - 1])}` : episodes.map(episode => `E${pad(episode)}`).join('')}`
}

// A season is searched once, for its pack and all its episodes, and an episode alone only when its season gave it nothing valid
export const searchShowUnits = async (
  units: ShowUnit[],
  episodes: ShowEpisode[],
  { znabs, terms, search, apply }: {
    znabs: any[],
    terms: string[],
    search: (znab: any, term: string, params: { season?: number, episode?: number }, served: ShowUnit[]) => Promise<any[]>,
    apply: (releases: any[], unit: ShowUnit) => any[],
  },
) => {
  const requests = new Map<string, any[]>()
  const request = async (params: { season?: number, episode?: number }, served: ShowUnit[]) => {
    const key = `${params.season}:${params.episode}`

    if (!requests.has(key)) {
      const releases = new Map()

      for (const znab of znabs) {
        for (const term of terms) {
          (await search(znab, term, params, served)).forEach((release) => releases.set(release.link, release))
        }
      }

      requests.set(key, [...releases.values()])
    }

    return requests.get(key)
  }
  const searched = new Map<ShowUnit, any[]>()
  let picks = []

  for (const unit of units) {
    if (isUnitCovered(unit, picks)) {
      continue
    }

    const found = unit.type === 'series'
      ? await request({}, [unit])
      : await request({ season: unit.season }, units.filter(({ type, season }) => type !== 'series' && season === unit.season))
    let results = apply(found, unit)

    if (unit.type === 'episode' && !results.some(({ valid }) => valid)) {
      const own = await request({ season: unit.season, episode: unit.episode }, [unit])
      results = apply([...new Map([...found, ...own].map((release) => [release.link, release])).values()], unit)
    }

    searched.set(unit, results)
    picks = pickReleases(units.map((unit) => ({ unit, results: searched.get(unit) || [] })), episodes)
  }

  return { picks, searched }
}
