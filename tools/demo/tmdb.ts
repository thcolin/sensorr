// What `seed.ts` and `tools/site/films.ts` share: TMDB with the demo's key, and the demo's policies

import oleoo from 'oleoo'

const KEY = process.env.SENSORR_DEMO_TMDB_KEY

export const keyed = () => {
  if (!KEY) {
    throw new Error('SENSORR_DEMO_TMDB_KEY is not set')
  }
}

export const tmdb = {
  async fetch(uri: string, params: { [key: string]: any } = {}) {
    const query = new URLSearchParams({ api_key: KEY, language: 'en-US', ...params })

    for (let attempt = 0; ; attempt++) {
      const res = await fetch(`https://api.themoviedb.org/3/${uri}?${query}`)

      if (res.status === 429 && attempt < 5) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
        continue
      }

      if (!res.ok) {
        throw new Error(`[TMDB] ${res.status} on ${uri}`)
      }

      return res.json()
    }
  },
}

// A few at a time, as TMDB asks
export const all = async <T, R>(items: T[], fn: (item: T) => Promise<R>, size = 10): Promise<R[]> => {
  const results: R[] = []

  for (let index = 0; index < items.length; index += size) {
    results.push(...await Promise.all(items.slice(index, index + size).map(fn)))
  }

  return results
}

export const pages = async (uri: string, count: number) => (await all(Array.from({ length: count }, (_, page) => page + 1), (page) => tmdb.fetch(uri, { page })))
  .flatMap(({ results }) => results)

export const parse = (title: string) => oleoo.parse(title, { strict: false, flagged: true, defaults: { language: 'VO', resolution: 'SD', year: '0' } })

export const POLICIES = [
  {
    name: 'Default',
    sorting: 'seeders',
    descending: true,
    match: { original_languages: [] },
    require: { znab: [], source: [], encoding: [], resolution: ['1080p', '2160p'], language: [], dub: [], flags: [] },
    prefer: { znab: [], source: ['BLURAY', 'WEB-DL'], encoding: ['x265', 'h265', 'x264'], resolution: ['2160p', '1080p'], language: ['MULTi', 'VOSTFR'], dub: ['EAC3', 'AC3'], flags: ['REMUX', 'HDR'] },
    avoid: { znab: [], source: ['CAM', 'TC', 'SCREENER'], encoding: ['XviD'], resolution: ['SD'], language: [], dub: [], flags: ['3D'] },
  },
  {
    name: 'French',
    sorting: 'seeders',
    descending: true,
    match: { original_languages: ['fr'] },
    require: { znab: [], source: [], encoding: [], resolution: ['1080p', '2160p'], language: ['MULTi', 'TRUEFRENCH', 'FRENCH'], dub: [], flags: [] },
    prefer: { znab: [], source: ['BLURAY', 'WEB-DL'], encoding: ['x265', 'x264'], resolution: ['1080p', '2160p'], language: ['TRUEFRENCH', 'MULTi', 'FRENCH'], dub: ['AC3'], flags: [] },
    avoid: { znab: [], source: ['CAM', 'TC', 'SCREENER'], encoding: ['XviD'], resolution: ['SD'], language: [], dub: [], flags: [] },
  },
]
