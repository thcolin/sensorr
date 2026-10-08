// Generates the data the landing page plays, `apps/site/src/data/films.json`, from TMDB with the demo's key:
//
//   SENSORR_DEMO_TMDB_KEY=... npx ts-node -r tsconfig-paths/register -P tools/tsconfig.tools.json --transpile-only -O '{"target":"es2022","esModuleInterop":true}' tools/site/films.ts
//
// The films are TMDB's recent and acclaimed ones, their releases the demo indexer's, ranked by the demo's Default
// policy as the jobs rank them. A film is kept when its releases tell the whole story: one Record grabbed, a better one
// for Refine, a lighter one for Shrink, and another to replace the one a friend reports. TMDB data may not be kept more
// than 6 months, so the file is not committed: the Demo workflow builds it.

import fs from 'fs'
import path from 'path'
import { Policy } from '../../libs/sensorr/src/lib/policy'
import { searchOf, INDEXER } from '../../apps/web/src/demo/releases'
import { proposalDiff } from '../../apps/web/src/pages/Proposals/queue'
import { tmdb, all, pages, POLICIES, keyed } from '../demo/tmdb'

const OUTPUT = path.join(__dirname, '../../apps/site/src/data/films.json')
const DISCOVER = { sort_by: 'vote_count.desc', 'primary_release_date.gte': '2014-01-01', 'vote_average.gte': 7.4, 'vote_count.gte': 3000 }
const WALL = 120
const SHOWS = 12
const UPCOMING = 12
// What Record shows of the candidates, the winner first
const CANDIDATES = 5

const policy = new Policy(POLICIES[0] as any)

const discover = async () => {
  const first = await tmdb.fetch('discover/movie', { ...DISCOVER, page: 1 })
  const rest = await all(Array.from({ length: first.total_pages - 1 }, (_, index) => index + 2), (page) => tmdb.fetch('discover/movie', { ...DISCOVER, page }))

  return [first, ...rest].flatMap(({ results }) => results).filter(({ poster_path }) => poster_path)
}

const lighten = (release) => ({
  title: release.title,
  size: release.size,
  seeders: release.seeders,
  valid: release.valid,
  score: release.score,
  reason: release.reason || null,
  meta: release.meta && {
    resolution: release.meta.resolution,
    source: release.meta.source,
    encoding: release.meta.encoding,
    dub: release.meta.dub,
    language: release.meta.language,
    group: release.meta.group,
  },
})

const diff = (from, to) => {
  const { rows, size } = proposalDiff([from], to, policy)
  return { rows: rows.map(({ axis, from, to, state }) => ({ axis, from, to, state })), size }
}

const storyOf = (details) => {
  const year = Number((details.release_date || '').slice(0, 4))
  const releases = policy.apply(
    searchOf({ title: details.title, year, runtime: details.runtime }).map((item) => ({ ...item, znab: INDEXER.name })),
    { terms: [details.title], titles: [details.title, details.original_title], years: [year], banned_releases: [] },
  )
  const valid = releases.filter(({ valid }) => valid)
  // Record grabbed the worst of them, before the others came out
  const [winner] = valid
  const owned = valid.length > 2 ? valid[valid.length - 1] : null
  const shrink = valid.filter((release) => release !== owned && release !== winner && release.size < winner.size).sort((a, b) => a.size - b.size)[0]
  // The friend reports the lighter one: another release takes its place, the best one left
  const replacement = valid.find((release) => release !== shrink && release !== owned)

  if (!winner || !owned || !shrink || !replacement) {
    return null
  }

  const director = details.credits?.crew?.find(({ job }) => job === 'Director')

  return {
    id: details.id,
    title: details.title,
    year,
    poster: details.poster_path,
    backdrop: details.backdrop_path,
    runtime: details.runtime,
    genres: details.genres.map(({ name }) => name),
    director: director ? { name: director.name, profile: director.profile_path } : null,
    candidates: releases.slice(0, CANDIDATES).map(lighten),
    owned: lighten(owned),
    winner: lighten(winner),
    shrink: lighten(shrink),
    replacement: lighten(replacement),
    refine: diff(owned, winner),
    shrinked: diff(winner, shrink),
    reported: diff(shrink, replacement),
  }
}

const main = async () => {
  keyed()

  const discovered = await discover()
  const details = await all(discovered.map(({ id }) => id), (id) => tmdb.fetch(`movie/${id}`, { append_to_response: 'credits' }))
  const films = details.map(storyOf).filter(Boolean)
  const shows = (await pages('tv/top_rated', 2))
    .filter(({ origin_country, poster_path }) => poster_path && !origin_country?.includes('JP'))
    .slice(0, SHOWS)
  const seasons = await all(shows.map(({ id }) => id), (id) => tmdb.fetch(`tv/${id}`))
  const upcoming = (await pages('movie/upcoming', 1)).filter(({ poster_path }) => poster_path).slice(0, UPCOMING)

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true })
  fs.writeFileSync(OUTPUT, JSON.stringify({
    wall: discovered.slice(0, WALL).map(({ poster_path }) => poster_path),
    films,
    shows: seasons.map(({ id, name, poster_path, first_air_date, seasons, number_of_episodes }) => ({
      id,
      title: name,
      poster: poster_path,
      year: Number((first_air_date || '').slice(0, 4)),
      seasons: seasons.filter(({ season_number }) => season_number > 0).map(({ season_number, episode_count }) => ({ number: season_number, episodes: episode_count })),
      episodes: number_of_episodes,
    })),
    upcoming: upcoming.map(({ id, title, poster_path, release_date }) => ({ id, title, poster: poster_path, date: release_date })),
  }))

  console.log(`[Site] ${films.length} films of ${discovered.length}, ${shows.length} shows, ${upcoming.length} upcoming, into ${path.relative(process.cwd(), OUTPUT)}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
