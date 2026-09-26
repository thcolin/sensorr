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
export const ENDED = ['Ended', 'Canceled']

export const STATUS_GROUPS = {
  airing: ['Returning Series'],
  upcoming: ['In Production', 'Planned', 'Pilot'],
  ended: ENDED,
}

type ShowDetails = {
  seasons?: { season_number: number, episode_count?: number, air_date?: string | null }[],
  last_episode_to_air?: { season_number: number, episode_number: number } | null,
  next_episode_to_air?: { season_number: number, episode_number: number, air_date?: string | null } | null,
}

export const isAiring = (status?: string | null): boolean => !!status && !ENDED.includes(status)

// TMDB dates are days, read at UTC midnight: formatted in UTC so no timezone moves them to the day before
const formatDay = (value: string | Date, region: string, options: Intl.DateTimeFormatOptions) => new Date(value).toLocaleDateString(region, { ...options, timeZone: 'UTC' })

// TMDB only names the last episode aired and the next one: the seasons before it aired whole, the ones after it not at all
export const progressOfDetails = (details: ShowDetails, now: Date | number = Date.now()) => {
  // A special to come is left out, like `next` in the API's progress
  const next = details?.next_episode_to_air?.season_number === 0 ? null : details?.next_episode_to_air
  // A special sits in none of the seasons: the regular episode before the next one places the progress instead
  const last = (details?.last_episode_to_air?.season_number === 0 && next?.season_number)
    ? { season_number: next.season_number, episode_number: next.episode_number - 1 }
    : details?.last_episode_to_air
  const seasons = (details?.seasons || [])
    .filter(({ season_number, episode_count }) => season_number !== 0 && episode_count > 0)
    .sort((a, b) => a.season_number - b.season_number)
    .map(({ season_number, episode_count, air_date }) => ({
      season_number,
      owned: 0,
      // Without a regular episode to come, a special places nothing: each season started by now is counted whole
      aired: last?.season_number === 0 ? ((air_date && new Date(air_date).getTime() <= new Date(now).getTime()) ? episode_count : 0)
        : (!last || season_number > last.season_number) ? 0 : season_number < last.season_number ? episode_count : Math.min(last.episode_number, episode_count),
    }))

  return {
    owned: 0,
    aired: seasons.reduce((sum, { aired }) => sum + aired, 0),
    next: next?.air_date || null,
    seasons,
  }
}

// The earliest air date still to come among the episodes outside season 0, like `next` in the API's progress
export const nextAirDateOf = (episodes: ShowEpisode[], now: Date | number = Date.now()): Date | null => episodes
  .filter(({ season_number, air_date }) => season_number !== 0 && !!air_date && new Date(air_date).getTime() > new Date(now).getTime())
  .map(({ air_date }) => new Date(air_date))
  .sort((a, b) => a.getTime() - b.getTime())[0] || null

export const diffusionOf = (
  show: { status?: string | null, first_air_date?: string | Date | null, last_air_date?: string | Date | null },
  { aired, next }: { aired: number, next?: string | Date | null },
  region = 'fr-FR',
): { airing: boolean, detail: string } => {
  const year = show?.last_air_date ? new Date(show.last_air_date).getUTCFullYear() : null

  // Before the episode count: an ended show whose episodes are unknown still ended
  if (ENDED.includes(show?.status)) {
    const word = show.status
    return { airing: false, detail: year ? `${word.toLowerCase()} in ${year}` : word.toLowerCase() }
  }

  if (aired === 0) {
    const first = next || show?.first_air_date
    const date = first ? formatDay(first, region, { day: '2-digit', month: '2-digit', year: 'numeric' }) : null
    return { airing: isAiring(show?.status), detail: date ? `first episode on ${date}` : 'first episode to be announced' }
  }

  if (isAiring(show?.status)) {
    const date = next ? formatDay(next, region, { day: '2-digit', month: '2-digit' }) : null
    return { airing: true, detail: date ? `next episode on ${date}` : 'still airing' }
  }

  return { airing: false, detail: '' }
}

// A season airs while its series does and one of its episodes outside season 0 has not aired yet, dated or not
export const seasonDiffusionOf = (
  status: string | null | undefined,
  episodes: ShowEpisode[],
  now: Date | number = Date.now(),
  region = 'fr-FR',
): { airing: boolean, detail: string } => {
  const airing = isAiring(status) && episodes.some(({ season_number, air_date }) => season_number !== 0 && (!air_date || new Date(air_date).getTime() > new Date(now).getTime()))

  if (!airing) {
    return { airing: false, detail: '' }
  }

  const next = nextAirDateOf(episodes, now)
  return { airing: true, detail: next ? `next episode on ${formatDay(next, region, { day: '2-digit', month: '2-digit' })}` : 'still airing' }
}

export const isTvCategory = (category) => [].concat(category ?? []).some(value => Math.floor(Number(value) / 1000) === 5)

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
      return level === 'series' && (!meta.seasons?.length || [...new Set(unit.episodes.map(({ season }) => season))].every(season => meta.seasons.includes(season)))
    case 'season':
      return level === 'season' && meta.seasons[0] === unit.season
    case 'episode':
      return level === 'episode' && meta.seasons[0] === unit.season && meta.episodes.includes(unit.episode)
  }
}

// A manual search shows the level searched and the levels above it that hold its target. The whole series shows its
// packs, even partial, and every season pack: a series rarely has a pack of all its seasons
export const reachesUnit = (meta, category, unit: ShowUnit) => {
  switch (levelOf(meta, category)) {
    case 'series':
      return unit.type === 'series' || !meta.seasons?.length || meta.seasons.includes(unit.season)
    case 'season':
      return unit.type === 'series' || meta.seasons[0] === unit.season
    case 'episode':
      return unit.type === 'episode' && matchesUnit(meta, category, unit)
    default:
      return false
  }
}

export const reachParamsOf = (unit: ShowUnit): { season?: number, episode?: number }[] => [
  ...(unit.type === 'episode' ? [{ season: unit.season, episode: unit.episode }] : []),
  ...(unit.type !== 'series' ? [{ season: unit.season }] : []),
  {},
]

export const unitLabel = (unit: ShowUnit) => unit.type === 'series' ? 'whole series' : [
  `S${String(unit.season).padStart(2, '0')}`,
  unit.type === 'episode' ? `E${String(unit.episode).padStart(2, '0')}` : ' pack',
].join('')

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
    const held = release ? coverageOf(release.meta, null, episodes) : []
    const fills = held.filter(covered => wanted.has(keyOf(covered)))

    if (!fills.length) {
      continue
    }

    fills.forEach(covered => wanted.delete(keyOf(covered)))

    if (unit.type === 'episode') {
      found.add(unit.season)
    }

    // The last resort pack replaces the episodes of its season already owned: a swap covers all it holds
    picked.push(unit.fallback ? { ...release, coverage: held, swap: true } : { ...release, coverage: fills })
  }

  return picked
}

export const isUnitCovered = (unit: ShowUnit, picks: { coverage: Coverage[] }[]) => {
  const covered = picks.flatMap(({ coverage }) => coverage)

  return unit.fallback
    ? covered.some(({ season }) => season === unit.season)
    : unit.episodes.every(({ season, episode }) => covered.some(c => c.season === season && c.episode === episode))
}

export const swapOf = (coverage: Coverage[], episodes: ShowEpisode[]) => {
  const covered = new Set(coverage.map(({ season, episode }) => `${season}:${episode}`))
  const owned = episodes.filter(({ season_number, episode_number, files }) => covered.has(`${season_number}:${episode_number}`) && files?.length)
  const files = new Map(owned.flatMap(({ files }) => files).map(file => [file.id, file]))

  return {
    fills: coverage.length - owned.length,
    replaces: owned.length,
    size: [...files.values()].reduce((sum, file) => sum + (file.size || 0), 0),
  }
}

// A manual pick covers all its release holds, followed or not, and replaces the files of the episodes already owned
export const manualPickOf = (release, episodes: ShowEpisode[]) => {
  const coverage = coverageOf(release.meta, null, episodes)

  return {
    coverage,
    level: levelOf(release.meta, release.category),
    ...(swapOf(coverage, episodes).replaces ? { swap: true } : {}),
  }
}

// Only a file Plex read can be deleted through Plex, and never one that also holds an episode the swap does not cover
export const swapReplacesOf = (coverage: Coverage[], episodes: ShowEpisode[]) => {
  const covered = new Set(coverage.map(({ season, episode }) => `${season}:${episode}`))
  const isCovered = ({ season_number, episode_number }: ShowEpisode) => covered.has(`${season_number}:${episode_number}`)
  const kept = new Set(episodes.filter(episode => !isCovered(episode)).flatMap(({ files }) => files || []).map(({ id }) => id))

  return [...new Set(episodes
    .filter(isCovered)
    .flatMap(({ files }) => files || [])
    .filter(({ from, id }) => from === 'sync' && !kept.has(id))
    .map(({ id }) => id))]
}

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
  const answered = new Set<string>()
  const pair = (key: string, znab, term: string) => `${key}:${znabs.indexOf(znab)}:${term}`
  const request = async (params: { season?: number, episode?: number }, served: ShowUnit[]) => {
    const key = `${params.season}:${params.episode}`

    if (!requests.has(key)) {
      const releases = new Map()

      for (const znab of znabs) {
        for (const term of terms) {
          if (params.episode !== undefined && !answered.has(pair(`${params.season}:undefined`, znab, term))) {
            continue
          }

          const found = await search(znab, term, params, served)
          found.forEach((release) => releases.set(release.link, release))

          if (found.length) {
            answered.add(pair(key, znab, term))
          }
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
