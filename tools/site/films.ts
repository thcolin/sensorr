// Generates the data the landing page plays, `apps/site/src/data/films.json`, from TMDB with the demo's key:
//
//   SENSORR_DEMO_TMDB_KEY=... npx ts-node -r tsconfig-paths/register -P tools/tsconfig.tools.json --transpile-only -O '{"target":"es2022","esModuleInterop":true}' tools/site/films.ts
//
// The films are TMDB's recent and acclaimed ones. Their releases tell the same story for each, ranked by the demo's
// Default policy as the jobs rank them: Record grabs a VO 1080p, Refine a MULTi 1080p a little heavier, Shrink a MULTi
// 2160p lighter than both, and a friend's report swaps that one. TMDB data may not be kept more than 6 months, so the
// file is not committed: the Demo workflow builds it.

import fs from 'fs'
import path from 'path'
import { Policy } from '../../libs/sensorr/src/lib/policy'
import { dotted, INDEXER } from '../../apps/web/src/demo/releases'
import { proposalDiff } from '../../apps/web/src/pages/Proposals/queue'
import { tmdb, all, pages, POLICIES, keyed } from '../demo/tmdb'

const OUTPUT = path.join(__dirname, '../../apps/site/src/data/films.json')
const DISCOVER = { sort_by: 'vote_count.desc', 'primary_release_date.gte': '2014-01-01', 'vote_average.gte': 7.2, 'vote_count.gte': 1500 }
const WALL = 120
const FILMS = 100
const SHOWS = 12
const UPCOMING = 12
// What Record shows of the candidates, the winner first
const CANDIDATES = 5

const policy = new Policy(POLICIES[0] as any)
// Bytes a minute of a 1080p encode weighs, as the demo indexer counts it
const MINUTE = 70e6

// The releases of a film's story, made up as the demo indexer makes them: Record grabs a VO 1080p, Refine finds the
// same in MULTi for a little more, Shrink a MULTi 2160p in x265 lighter than both, and a friend's report swaps that one
const storyReleases = (title: string, year: number, runtime: number) => {
  const name = (rest: string) => `${dotted(title)}.${year}.${rest}`
  const weigh = (factor: number) => Math.round((runtime || 110) * MINUTE * factor)
  const item = (rest: string, factor: number, seeders: number) => ({ guid: rest, title: name(rest), size: weigh(factor), seeders, znab: INDEXER.name, publishDate: new Date().toISOString() })

  return {
    owned: item('1080p.WEB-DL.x264.AC3-TAPE', 1, 212),
    winner: item('MULTi.1080p.BluRay.x264.AC3-VCR', 1.12, 148),
    shrink: item('MULTi.2160p.WEB-DL.x265.EAC3-REWiND', 0.62, 96),
    replacement: item('MULTi.2160p.BluRay.x265.EAC3-KINESCOPE', 0.7, 71),
    // What Record saw beside the one it grabbed, before the others came out
    others: [item('720p.HDTV.x264.AAC-DEMO', 0.45, 39), item('TRUEFRENCH.1080p.TC.x264.AC3-SPRNG', 0.9, 54)],
  }
}

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
    flags: release.meta.flags,
  },
})

const diff = (from, to) => {
  const { rows, size } = proposalDiff([from], to, policy)
  return { rows: rows.map(({ axis, from, to, state }) => ({ axis, from, to, state })), size }
}

const storyOf = (details) => {
  const year = Number((details.release_date || '').slice(0, 4))
  const story = storyReleases(details.title, year, details.runtime)
  const query = { terms: [details.title], titles: [details.title, details.original_title], years: [year], banned_releases: [] }
  const ranked = policy.apply([story.owned, story.winner, story.shrink, story.replacement], query)
  const [owned, winner, shrink, replacement] = [story.owned, story.winner, story.shrink, story.replacement].map(({ guid }) => ranked.find((release) => release.guid === guid))
  const candidates = policy.apply([story.owned, ...story.others], query)

  if (![owned, winner, shrink, replacement].every(({ valid }) => valid) || candidates[0].guid !== owned.guid) {
    return null
  }

  const director = details.credits?.crew?.find(({ job }) => job === 'Director')

  return {
    id: details.id,
    title: details.title,
    year,
    poster: details.poster_path,
    backdrop: details.backdrop_path,
    // The title as the film's own lettering, in English
    logo: details.images?.logos?.find(({ iso_639_1 }) => iso_639_1 === 'en')?.file_path || null,
    runtime: details.runtime,
    genres: details.genres.map(({ name }) => name),
    director: director ? { name: director.name, profile: director.profile_path } : null,
    candidates: candidates.map(lighten),
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
  const details = await all(discovered.map(({ id }) => id), (id) => tmdb.fetch(`movie/${id}`, { append_to_response: 'credits,images', include_image_language: 'en,null' }))
  const films = details.filter(({ backdrop_path, images }) => backdrop_path && images?.logos?.length).map(storyOf).filter(Boolean).slice(0, FILMS)
  const shows = (await pages('tv/top_rated', 2))
    .filter(({ origin_country, poster_path }) => poster_path && !origin_country?.includes('JP'))
    .slice(0, SHOWS)
  const seasons = await all(shows.map(({ id }) => id), (id) => tmdb.fetch(`tv/${id}`))
  const today = new Date().toISOString().slice(0, 10)
  const upcoming = (await tmdb.fetch('discover/movie', { sort_by: 'popularity.desc', 'primary_release_date.gte': today, with_release_type: '2|3' })).results
    .filter(({ poster_path }) => poster_path)
    .sort((a, b) => a.release_date.localeCompare(b.release_date))
    .slice(0, UPCOMING)

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true })
  fs.writeFileSync(OUTPUT, JSON.stringify({
    policy: { name: POLICIES[0].name, require: POLICIES[0].require, prefer: POLICIES[0].prefer, avoid: POLICIES[0].avoid },
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
