import oleoo from 'oleoo'
import { Policy, SENSORR_POLICY_FALLBACK } from './policy'
import { Sensorr } from './sensorr'
import { coverageLabel, coverageOf, isUnitCovered, pickReleases, searchShowUnits, searchUnits, ShowUnit } from './show'
import { clean } from './utils'

const now = new Date('2026-09-24T12:00:00Z')
const day = 24 * 60 * 60 * 1000
const dateOf = (time: number) => new Date(time).toISOString().slice(0, 10)

const seasonOf = (season_number: number, count: number, start: string, extra = {}) => Array.from({ length: count }, (_, index) => ({
  season_number,
  episode_number: index + 1,
  air_date: dateOf(new Date(start).getTime() + index * 7 * day),
  monitored: season_number !== 0,
  files: [],
  release: null,
  ...extra,
}))

const friends = {
  id: 1668,
  name: 'Friends',
  original_name: 'Friends',
  status: 'Ended',
  first_air_date: '1994-09-22',
  last_air_date: '2004-05-06',
  alternative_titles: { results: [{ iso_3166_1: 'FR', title: 'Friends', type: '' }] },
}
const friendsEpisodes = () => [
  ...seasonOf(0, 3, '2001-01-01'),
  ...[24, 24, 25, 24, 24, 25, 24, 24, 24, 18].flatMap((count, index) => seasonOf(index + 1, count, `${1994 + index}-09-22`)),
]

const airing = { id: 1, name: 'Airing Show', status: 'Returning Series', first_air_date: '2022-09-01', last_air_date: '2026-09-24' }
const airingEpisodes = () => [
  ...seasonOf(1, 8, '2022-09-01', { files: [{ id: 'f' }] }),
  ...seasonOf(2, 8, '2024-09-05').map(episode => episode.episode_number === 3 ? { ...episode, files: [{ id: 'f' }] } : episode),
  ...seasonOf(3, 10, '2026-08-20'),
]

const cats = {
  id: 17420,
  name: 'Samouraï Pizza Cats',
  original_name: 'キャッ党 忍伝てやんでえ',
  status: 'Ended',
  first_air_date: '1990-02-01',
  last_air_date: '1991-02-12',
  alternative_titles: {
    results: [
      { iso_3166_1: 'FR', title: 'Samourai Pizza Cats', type: '' },
      { iso_3166_1: 'US', title: 'Samurai Pizza Cats', type: '' },
      { iso_3166_1: 'GB', title: 'Samurai Pizza Cats', type: '' },
      { iso_3166_1: 'JP', title: 'Kyatto Ninden Teyandee', type: 'romaji' },
    ],
  },
}

const own = (episodes, season, episode) => episodes.map(e => (e.season_number === season && e.episode_number === episode) ? { ...e, files: [{ id: 'f' }] } : e)
const labels = (units: ShowUnit[]) => units.map(({ type, season, episode, fallback }) => [type, season, episode, fallback].filter(v => v !== undefined).join(':'))

const release = (original: string, category = [5040], seeders = 10) => {
  const meta = oleoo.parse(original, { strict: false, flagged: true, defaults: { language: 'VO', resolution: 'SD', year: '0' } })
  return { original, title: meta.generated, link: original, publishDate: new Date('2026-01-01'), seeders, category, znab: 'test', meta }
}

describe('Sensorr.getShowQuery', () => {
  const sensorr = new Sensorr({ region: 'fr-FR' })

  it('gives the show names, its alternative titles and every year from its first to its last air date', () => {
    const show = {
      name: 'La Casa de Papel',
      original_name: 'La casa de papel',
      first_air_date: '2017-05-02',
      last_air_date: '2021-12-03',
      alternative_titles: {
        results: [
          { iso_3166_1: 'US', title: 'Money Heist', type: '' },
          { iso_3166_1: 'ES', title: 'La casa de papel: Parte 1', type: '' },
          { iso_3166_1: 'FR', title: 'La Casa de Papel (2017)', type: '' },
        ],
      },
    }

    expect(sensorr.getShowQuery(show, null, ['banned'])).toEqual({
      _defaults: {
        titles: ['la casa de papel', 'money heist', 'la casa de papel 2017'],
        terms: ['la casa de papel', 'money heist'],
        years: ['2017', '2018', '2019', '2020', '2021'],
      },
      banned_releases: ['banned'],
      titles: ['la casa de papel', 'money heist', 'la casa de papel 2017'],
      terms: ['la casa de papel', 'money heist'],
      years: ['2017', '2018', '2019', '2020', '2021'],
    })
  })

  it('gives the first air year alone to a show without a last air date, and no year without a first one', () => {
    expect(sensorr.getShowQuery({ name: 'Pilot', first_air_date: '2026-09-17' }).years).toEqual(['2026'])
    expect(sensorr.getShowQuery({ name: 'Pilot' }).years).toEqual([])
  })

  it('searches the names and the FR, US and GB titles once each, and a term in another script only when it is the only one', () => {
    const query = sensorr.getShowQuery(cats)

    expect(query.terms).toEqual(['samourai pizza cats', 'samurai pizza cats'])
    expect(query.titles).toEqual(['samourai pizza cats', clean(cats.original_name), 'samurai pizza cats'])
    expect(sensorr.getShowQuery({ name: cats.original_name, original_name: cats.original_name }).terms).toEqual([clean(cats.original_name)])
  })

  it('keeps a saved query only when it has titles, terms and years', () => {
    expect(sensorr.getShowQuery(friends, { titles: ['f'], terms: ['f'], years: ['1994'] })).toMatchObject({ terms: ['f'], years: ['1994'] })
    expect(sensorr.getShowQuery(friends, { titles: ['f'], terms: ['f'], years: [] })).toMatchObject({ terms: ['friends'] })
  })
})

describe('Policy.apply on a show', () => {
  const policy = new Policy(SENSORR_POLICY_FALLBACK as any)
  const query = new Sensorr({ region: 'fr-FR' }).getShowQuery(friends)
  const validOf = (unit, releases) => Object.fromEntries(policy.apply(releases, { ...query, unit } as any).map(({ original, valid }) => [original, valid]))

  it('takes a complete series, a multi-season pack or an INTEGRALE filed under TV for the whole series', () => {
    expect(validOf({ type: 'series', episodes: [] }, [
      release('Friends.Complete.Series.1080p.BluRay.x264-GRP'),
      release('Friends.S01-S10.COMPLETE.MULTi.1080p.BluRay.x264-GRP'),
      release('Friends.1994.INTEGRALE.FRENCH.1080p.BluRay.x264-GRP', [5040]),
      release('Friends.INTEGRALE.FRENCH.1080p.BluRay.x264-GRP', [2040]),
      release('Friends.S02.MULTi.1080p.BluRay.x264-GRP'),
      release('Friends.S02E05.MULTi.1080p.BluRay.x264-GRP'),
    ])).toEqual({
      'Friends.Complete.Series.1080p.BluRay.x264-GRP': true,
      'Friends.S01-S10.COMPLETE.MULTi.1080p.BluRay.x264-GRP': true,
      'Friends.1994.INTEGRALE.FRENCH.1080p.BluRay.x264-GRP': true,
      'Friends.INTEGRALE.FRENCH.1080p.BluRay.x264-GRP': false,
      'Friends.S02.MULTi.1080p.BluRay.x264-GRP': false,
      'Friends.S02E05.MULTi.1080p.BluRay.x264-GRP': false,
    })
  })

  it('takes a multi-season pack for the whole series only when it holds every season the series wants', () => {
    const unit = { type: 'series', episodes: Array.from({ length: 10 }, (_, index) => ({ season: index + 1, episode: 1 })) }

    expect(validOf(unit, [
      release('Friends.S01-S03.1080p.BluRay.x264-GRP'),
      release('Friends.S01-S10.COMPLETE.MULTi.1080p.BluRay.x264-GRP'),
      release('Friends.Complete.Series.1080p.BluRay.x264-GRP'),
    ])).toEqual({
      'Friends.S01-S03.1080p.BluRay.x264-GRP': false,
      'Friends.S01-S10.COMPLETE.MULTi.1080p.BluRay.x264-GRP': true,
      'Friends.Complete.Series.1080p.BluRay.x264-GRP': true,
    })
  })

  it('takes only a pack of that season for a season, and only that episode for an episode', () => {
    const releases = [
      release('Friends.S02.MULTi.1080p.BluRay.x264-GRP'),
      release('Friends.Saison.2.FRENCH.1080p.WEB.x264-GRP'),
      release('Friends.S03.MULTi.1080p.BluRay.x264-GRP'),
      release('Friends.S01-S10.COMPLETE.MULTi.1080p.BluRay.x264-GRP'),
      release('Friends.1994.INTEGRALE.FRENCH.1080p.BluRay.x264-GRP'),
      release('Friends.S02E05.MULTi.1080p.BluRay.x264-GRP'),
      release('Friends.S02E04E05.MULTi.1080p.BluRay.x264-GRP'),
      release('Friends.S02E06.MULTi.1080p.BluRay.x264-GRP'),
    ]

    expect(validOf({ type: 'season', season: 2, episodes: [] }, releases)).toMatchObject({
      'Friends.S02.MULTi.1080p.BluRay.x264-GRP': true,
      'Friends.Saison.2.FRENCH.1080p.WEB.x264-GRP': true,
      'Friends.S03.MULTi.1080p.BluRay.x264-GRP': false,
      'Friends.S01-S10.COMPLETE.MULTi.1080p.BluRay.x264-GRP': false,
      'Friends.1994.INTEGRALE.FRENCH.1080p.BluRay.x264-GRP': false,
      'Friends.S02E05.MULTi.1080p.BluRay.x264-GRP': false,
    })
    expect(validOf({ type: 'episode', season: 2, episode: 5, episodes: [] }, releases)).toMatchObject({
      'Friends.S02.MULTi.1080p.BluRay.x264-GRP': false,
      'Friends.S02E05.MULTi.1080p.BluRay.x264-GRP': true,
      'Friends.S02E04E05.MULTi.1080p.BluRay.x264-GRP': true,
      'Friends.S02E06.MULTi.1080p.BluRay.x264-GRP': false,
    })
  })

  it('refuses another show, a year outside the show years and a movie, and keeps the ban', () => {
    const results = Object.fromEntries(policy.apply([
      release('Friends.With.Benefits.S01E01.1080p.WEB.x264-GRP'),
      release('Friends.2010.S01E01.1080p.WEB.x264-GRP'),
      release('Friends.1994.S01E01.1080p.WEB.x264-GRP'),
      release('Friends.1994.MULTi.1080p.BluRay.x264-GRP'),
      release('Friends.S01E01.MULTi.1080p.BluRay.x264-GRP'),
    ], { ...query, banned_releases: ['Friends.S01E01.MULTi.1080p.BluRay.x264-GRP'], unit: { type: 'episode', season: 1, episode: 1, episodes: [] } } as any)
      .map(({ original, valid, reason }) => [original, valid ? true : reason.slice(0, 2)]))

    expect(results).toEqual({
      'Friends.With.Benefits.S01E01.1080p.WEB.x264-GRP': '🎯',
      'Friends.2010.S01E01.1080p.WEB.x264-GRP': '📅',
      'Friends.1994.S01E01.1080p.WEB.x264-GRP': true,
      'Friends.1994.MULTi.1080p.BluRay.x264-GRP': '📺',
      'Friends.S01E01.MULTi.1080p.BluRay.x264-GRP': '🚫',
    })
  })

  it('still refuses a COLLECTION on a movie search', () => {
    const [collection] = policy.apply([release('Friends.1994.INTEGRALE.FRENCH.1080p.BluRay.x264-GRP')], { ...query, years: ['1994'] } as any)

    expect(collection.valid).toBe(false)
    expect(collection.reason).toBe('📚 COLLECTION release')
  })
})

describe('coverageOf', () => {
  const episodes = friendsEpisodes()
  const coverage = (name: string) => coverageOf(release(name).meta, friends, episodes)

  it('gives every episode outside season 0 to a whole series', () => {
    expect(coverage('Friends.Complete.Series.1080p.BluRay.x264-GRP')).toHaveLength(236)
    expect(coverage('Friends.1994.INTEGRALE.FRENCH.1080p.BluRay.x264-GRP')).toHaveLength(236)
    expect(coverage('Friends.S01-S10.COMPLETE.MULTi.1080p.BluRay.x264-GRP')).toHaveLength(236)
    expect(coverage('Friends.Complete.Series.1080p.BluRay.x264-GRP').some(({ season }) => season === 0)).toBe(false)
  })

  it('gives every episode of the seasons a pack covers', () => {
    expect(coverage('Friends.S03.MULTi.1080p.BluRay.x264-GRP')).toHaveLength(25)
    expect(coverage('Friends.S01-S03.MULTi.1080p.BluRay.x264-GRP')).toHaveLength(73)
    expect(coverage('Friends.Saison.10.FRENCH.1080p.WEB.x264-GRP')).toHaveLength(18)
  })

  it('gives the episodes a release names in its season, and only those TMDB knows', () => {
    expect(coverage('Friends.S01E01E02.1080p.WEB.x264-GRP')).toEqual([{ season: 1, episode: 1 }, { season: 1, episode: 2 }])
    expect(coverage('Friends.S04E24.1080p.WEB.x264-GRP')).toEqual([{ season: 4, episode: 24 }])
    expect(coverage('Friends.S04E25.1080p.WEB.x264-GRP')).toEqual([])
  })

  it('gives nothing to a movie or to an episode without season', () => {
    expect(coverage('Friends.1994.MULTi.1080p.BluRay.x264-GRP')).toEqual([])
    expect(coverage('Friends.E05.1080p.WEB.x264-GRP')).toEqual([])
  })
})

describe('searchUnits', () => {
  it('searches an ended show with nothing owned as a whole series, then season packs, then episodes', () => {
    const units = searchUnits(friends, friendsEpisodes(), now)

    expect(labels(units.slice(0, 12))).toEqual([
      'series', 'season:1', 'season:2', 'season:3', 'season:4', 'season:5',
      'season:6', 'season:7', 'season:8', 'season:9', 'season:10', 'episode:1:1',
    ])
    expect(units).toHaveLength(1 + 10 + 236)
    expect(units[0].episodes).toHaveLength(236)
    expect(units[1].episodes).toHaveLength(24)
    expect(units.some(({ fallback }) => fallback)).toBe(false)
  })

  it('searches a canceled show the same way, but an ended one with an owned episode by season', () => {
    expect(labels(searchUnits({ status: 'Canceled' }, friendsEpisodes(), now).slice(0, 1))).toEqual(['series'])

    const units = searchUnits(friends, own(friendsEpisodes(), 5, 3), now)

    expect(labels(units.slice(0, 10))).toEqual([
      'season:1', 'season:2', 'season:3', 'season:4', 'season:6', 'season:7', 'season:8', 'season:9', 'season:10', 'episode:1:1',
    ])
    expect(labels(units.slice(-1))).toEqual(['season:5:true'])
    expect(units[units.length - 1].episodes).toHaveLength(23)
    expect(units).toHaveLength(9 + 235 + 1)
  })

  it('only searches wanted episodes, and a special only on its own', () => {
    const episodes = friendsEpisodes()
      .map(episode => ({ ...episode, monitored: episode.season_number === 3 || (episode.season_number === 0 && episode.episode_number === 2) }))
    const units = searchUnits(friends, own(episodes, 1, 1), now)

    expect(labels(units.filter(({ type }) => type !== 'episode'))).toEqual(['season:3'])
    expect(labels(units.filter(({ type }) => type === 'episode')).slice(0, 2)).toEqual(['episode:0:2', 'episode:3:1'])
    expect(units[0].episodes).toHaveLength(25)
  })

  it('never packs a season or a series with an episode outside season 0 that is unmonitored or already proposed', () => {
    const unmonitored = friendsEpisodes().map(e => (e.season_number === 2 && e.episode_number === 7) ? { ...e, monitored: false } : e)
    const proposed = friendsEpisodes().map(e => (e.season_number === 4 && e.episode_number === 1) ? { ...e, release: 'guid' } : e)

    expect(labels(searchUnits(friends, unmonitored, now).filter(({ type }) => type !== 'episode'))).toEqual([
      'season:1', 'season:3', 'season:4', 'season:5', 'season:6', 'season:7', 'season:8', 'season:9', 'season:10',
    ])
    expect(searchUnits(friends, unmonitored, now).filter(({ type, season }) => type === 'episode' && season === 2)).toHaveLength(23)
    expect(labels(searchUnits(friends, proposed, now).filter(({ type }) => type !== 'episode'))).toEqual([
      'season:1', 'season:2', 'season:3', 'season:5', 'season:6', 'season:7', 'season:8', 'season:9', 'season:10',
    ])
  })

  it('keeps the last resort pack of a season whose other episodes are all monitored and wanted', () => {
    const owned = own(friendsEpisodes(), 5, 3)
    const unmonitored = owned.map(e => (e.season_number === 5 && e.episode_number === 9) ? { ...e, monitored: false } : e)

    expect(labels(searchUnits(friends, owned, now).filter(({ fallback }) => fallback))).toEqual(['season:5:true'])
    expect(labels(searchUnits(friends, unmonitored, now).filter(({ fallback }) => fallback))).toEqual([])
  })

  it('never packs a season or a series with an episode not aired for a full day', () => {
    const episodes = airingEpisodes()
    const units = searchUnits(airing, episodes, now)

    expect(labels(units)).toEqual([
      'episode:2:1', 'episode:2:2', 'episode:2:4', 'episode:2:5', 'episode:2:6', 'episode:2:7', 'episode:2:8',
      'episode:3:1', 'episode:3:2', 'episode:3:3', 'episode:3:4', 'episode:3:5', 'episode:3:6',
      'season:2:true',
    ])

    const finale = episodes.filter(({ season_number, episode_number }) => season_number !== 3 || episode_number <= 6)
    const today = finale.map(episode => (episode.season_number === 3 && episode.episode_number === 6) ? { ...episode, air_date: '2026-09-24' } : episode)
    const yesterday = finale.map(episode => (episode.season_number === 3 && episode.episode_number === 6) ? { ...episode, air_date: '2026-09-23' } : episode)

    expect(labels(searchUnits({ ...airing, status: 'Ended' }, today, now)).filter(label => !label.startsWith('episode'))).toEqual(['season:2:true'])
    expect(labels(searchUnits({ ...airing, status: 'Ended' }, yesterday, now)).filter(label => !label.startsWith('episode'))).toEqual(['season:3', 'season:2:true'])
    expect(labels(searchUnits(friends, friendsEpisodes().map(e => e.season_number === 10 && e.episode_number === 18 ? { ...e, air_date: null } : e), now).slice(0, 1))).toEqual(['season:1'])
  })

  it('gives nothing to search when nothing is wanted', () => {
    expect(searchUnits(friends, friendsEpisodes().map(episode => ({ ...episode, monitored: false })), now)).toEqual([])
  })
})

describe('pickReleases', () => {
  const policy = new Policy(SENSORR_POLICY_FALLBACK as any)
  const query = new Sensorr({ region: 'fr-FR' }).getShowQuery(friends)
  const search = (units: ShowUnit[], found: Record<string, string[]>) => units.map(unit => ({
    unit,
    results: policy.apply((found[labels([unit])[0]] || []).map(name => release(name)), { ...query, unit } as any),
  }))
  const picked = (picks) => picks.map(({ original, coverage }) => [original, coverage.length])

  it('takes the whole series and nothing else when it is found', () => {
    const episodes = friendsEpisodes()
    const units = searchUnits(friends, episodes, now)

    expect(picked(pickReleases(search(units, {
      series: ['Friends.S02.MULTi.1080p.BluRay.x264-GRP', 'Friends.Complete.Series.1080p.BluRay.x264-GRP'],
      'season:2': ['Friends.S02.MULTi.1080p.BluRay.x264-GRP'],
      'episode:1:1': ['Friends.S01E01.MULTi.1080p.BluRay.x264-GRP'],
    }), episodes))).toEqual([['Friends.Complete.Series.1080p.BluRay.x264-GRP', 236]])
  })

  it('falls back from packs to episodes, and to the last resort pack of a season whose episodes found nothing', () => {
    const episodes = own(friendsEpisodes(), 5, 3)
    const units = searchUnits(friends, episodes, now)
    const packs = Object.fromEntries([1, 2, 3, 4, 6, 8, 9, 10].map(season => [`season:${season}`, [`Friends.S${String(season).padStart(2, '0')}.MULTi.1080p.BluRay.x264-GRP`]]))
    const picks = pickReleases(search(units, {
      ...packs,
      'episode:7:1': ['Friends.S07E01E02.MULTi.1080p.BluRay.x264-GRP'],
      'episode:7:2': ['Friends.S07E02.MULTi.1080p.BluRay.x264-GRP'],
      'episode:7:3': ['Friends.S07E03.MULTi.1080p.BluRay.x264-GRP'],
      'season:5:true': ['Friends.S05.MULTi.1080p.BluRay.x264-GRP'],
    }), episodes)

    expect(picked(picks)).toEqual([
      ['Friends.S01.MULTi.1080p.BluRay.x264-GRP', 24],
      ['Friends.S02.MULTi.1080p.BluRay.x264-GRP', 24],
      ['Friends.S03.MULTi.1080p.BluRay.x264-GRP', 25],
      ['Friends.S04.MULTi.1080p.BluRay.x264-GRP', 24],
      ['Friends.S06.MULTi.1080p.BluRay.x264-GRP', 25],
      ['Friends.S08.MULTi.1080p.BluRay.x264-GRP', 24],
      ['Friends.S09.MULTi.1080p.BluRay.x264-GRP', 24],
      ['Friends.S10.MULTi.1080p.BluRay.x264-GRP', 18],
      ['Friends.S07E01E02.MULTi.1080p.BluRay.x264-GRP', 2],
      ['Friends.S07E03.MULTi.1080p.BluRay.x264-GRP', 1],
      ['Friends.S05.MULTi.1080p.BluRay.x264-GRP', 23],
    ])
    expect(picks.flatMap(({ coverage }) => coverage).some(({ season, episode }) => season === 5 && episode === 3)).toBe(false)
  })

  it('skips the last resort pack of a season one of whose episodes was found', () => {
    const episodes = own(friendsEpisodes(), 5, 3)
    const units = searchUnits(friends, episodes, now).filter(({ season }) => season === 5)

    expect(picked(pickReleases(search(units, {
      'episode:5:1': ['Friends.S05E01.MULTi.1080p.BluRay.x264-GRP'],
      'season:5:true': ['Friends.S05.MULTi.1080p.BluRay.x264-GRP'],
    }), episodes))).toEqual([['Friends.S05E01.MULTi.1080p.BluRay.x264-GRP', 1]])
  })

  it('keeps a unit only when its first valid release covers a still wanted episode', () => {
    const episodes = friendsEpisodes().filter(({ season_number }) => season_number === 1)
    const units: ShowUnit[] = [
      { type: 'episode', season: 1, episode: 1, episodes: [{ season: 1, episode: 1 }] },
      { type: 'episode', season: 1, episode: 2, episodes: [{ season: 1, episode: 2 }] },
      { type: 'episode', season: 1, episode: 3, episodes: [{ season: 1, episode: 3 }] },
    ]
    const results = [
      [{ ...release('Friends.S01E01E02.MULTi.1080p.BluRay.x264-GRP'), valid: true }],
      [{ ...release('Friends.S01E02.MULTi.1080p.BluRay.x264-GRP'), valid: true }, { ...release('Friends.S01E02E03.MULTi.1080p.BluRay.x264-GRP'), valid: true }],
      [{ ...release('Friends.S01E03.MULTi.1080p.BluRay.x264-GRP'), valid: false }],
    ]

    expect(picked(pickReleases(units.map((unit, index) => ({ unit, results: results[index] })), episodes))).toEqual([
      ['Friends.S01E01E02.MULTi.1080p.BluRay.x264-GRP', 2],
    ])
  })
})

describe('searchShowUnits', () => {
  const policy = new Policy(SENSORR_POLICY_FALLBACK as any)
  const query = new Sensorr({ region: 'fr-FR' }).getShowQuery(cats)
  const znabs = ['ABN', 'TPB', 'TR4KER', 'C411'].map(name => ({ name }))
  const episodes = seasonOf(1, 54, '1990-02-01')
  const units = searchUnits(cats, episodes, now)
  const episodeName = (episode: number) => `Samurai.Pizza.Cats.S01E${String(episode).padStart(2, '0')}.MULTi.1080p.WEB.x264-GRP`
  const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, index) => from + index)
  const run = async (answer: (params: { season?: number, episode?: number }, znab: string) => string[]) => {
    const requests = []
    const { picks } = await searchShowUnits(units, episodes, {
      znabs,
      terms: query.terms,
      apply: (releases, unit) => policy.apply(releases, { ...query, unit } as any),
      search: async (znab, term, params) => {
        requests.push({ znab: znab.name, term, ...params })
        return answer(params, znab.name).map(name => release(name))
      },
    })

    return { requests, picks: picks.map(({ original, coverage }) => [original, coverage.length]) }
  }

  it('plans a whole series, its season and its 54 episodes', () => {
    expect(units.length).toBe(56)
  })

  it('searches the season once for its pack and its 54 episodes', async () => {
    const { requests, picks } = await run(({ season, episode }) => (season === 1 && episode === undefined) ? range(1, 54).map(episodeName) : [])

    expect(requests.length).toBe(16)
    expect(requests.filter(({ episode }) => episode !== undefined)).toEqual([])
    expect(picks).toEqual(range(1, 54).map(episode => [episodeName(episode), 1]))
  })

  it('takes the season pack out of the season results before any episode', async () => {
    const pack = 'Samurai.Pizza.Cats.S01.MULTi.1080p.WEB.x264-GRP'
    const { requests, picks } = await run(({ season, episode }) => (season === 1 && episode === undefined) ? [...range(1, 54).map(episodeName), pack] : [])

    expect(requests.length).toBe(16)
    expect(picks).toEqual([[pack, 54]])
  })

  it('searches an episode alone only when the season results give it no valid release', async () => {
    const { requests, picks } = await run(({ season, episode }) => (
      episode === undefined ? (season === 1 ? range(1, 50).map(episodeName) : []) : [episodeName(episode)]
    ))

    expect(requests.length).toBe(16 + 4 * 8)
    expect([...new Set(requests.map(({ episode }) => episode).filter(Boolean))]).toEqual([51, 52, 53, 54])
    expect(picks.length).toBe(54)
  })

  it('searches an episode alone only on the indexers whose season search found something', async () => {
    const { requests, picks } = await run(({ season, episode }, znab) => (
      znab !== 'ABN' ? [] : episode === undefined ? (season === 1 ? range(1, 50).map(episodeName) : []) : [episodeName(episode)]
    ))

    expect(requests.length).toBe(16 + 4 * 2)
    expect([...new Set(requests.filter(({ episode }) => episode).map(({ znab }) => znab))]).toEqual(['ABN'])
    expect(picks.length).toBe(54)
  })

  it('searches no episode alone when the season search finds nothing', async () => {
    const { requests, picks } = await run(() => [])

    expect(requests.length).toBe(16)
    expect(requests.filter(({ episode }) => episode !== undefined)).toEqual([])
    expect(picks).toEqual([])
  })
})

describe('isUnitCovered', () => {
  const episode = (season: number, number: number): ShowUnit => ({ type: 'episode', season, episode: number, episodes: [{ season, episode: number }] })
  const picks = [{ coverage: [{ season: 1, episode: 1 }, { season: 1, episode: 2 }] }]

  it('skips a unit once every episode it targets is picked', () => {
    expect(isUnitCovered(episode(1, 2), picks)).toBe(true)
    expect(isUnitCovered(episode(1, 3), picks)).toBe(false)
    expect(isUnitCovered({ type: 'season', season: 1, episodes: [{ season: 1, episode: 2 }, { season: 1, episode: 3 }] }, picks)).toBe(false)
    expect(isUnitCovered(episode(1, 3), [])).toBe(false)
  })

  it('skips a last resort pack once any episode of its season is picked', () => {
    const fallback: ShowUnit = { type: 'season', season: 1, episodes: [{ season: 1, episode: 3 }], fallback: true }

    expect(isUnitCovered(fallback, picks)).toBe(true)
    expect(isUnitCovered({ ...fallback, season: 2, episodes: [{ season: 2, episode: 1 }] }, picks)).toBe(false)
  })

  it('agrees with pickReleases on the units left to search', () => {
    const episodes = own(friendsEpisodes(), 5, 3)
    const units = searchUnits(friends, episodes, now).filter(({ season }) => season === 5)
    const results = new Map([[units[0], [{ ...release('Friends.S05E01E02.MULTi.1080p.BluRay.x264-GRP'), valid: true }]]])
    const picks = pickReleases(units.map(unit => ({ unit, results: results.get(unit) || [] })), episodes)

    expect(units.filter(unit => !isUnitCovered(unit, picks)).map(({ episode }) => episode).slice(0, 2)).toEqual([4, 5])
    expect(isUnitCovered(units[units.length - 1], picks)).toBe(true)
  })
})

describe('coverageLabel', () => {
  const range = (season: number, from: number, to: number) => Array.from({ length: to - from + 1 }, (_, index) => ({ season, episode: from + index }))

  it('names several seasons by their range, and a pack by its season', () => {
    expect(coverageLabel([...range(1, 1, 24), ...range(10, 1, 18)], 'series')).toBe('S01-S10')
    expect(coverageLabel(range(3, 1, 25), 'season')).toBe('S03')
    expect(coverageLabel(range(3, 2, 25), 'season')).toBe('S03')
    expect(coverageLabel(range(3, 1, 25))).toBe('S03')
  })

  it('names episodes by their numbers, a run of them by its bounds', () => {
    expect(coverageLabel([{ season: 3, episode: 4 }])).toBe('S03E04')
    expect(coverageLabel(range(3, 4, 6), 'episode')).toBe('S03E04-E06')
    expect(coverageLabel([{ season: 3, episode: 6 }, { season: 3, episode: 4 }], 'episode')).toBe('S03E04E06')
    expect(coverageLabel([])).toBe('')
  })
})
