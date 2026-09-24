import { bansOf, isBusy, newReportsOf, cursorOf, movieOf, reportedOf, isPending, replacesOf } from './reports'

const server = 'a-plex-server'
const synced = { id: 'plex://movie/a#1', title: 'Douglas 2020 FRENCH 1080p x264', original: 'Hannah.Gadsby.Douglas.2020.1080p.WEB.H264-GRP', from: 'sync' }
const proposed = { id: 'https://indexer/1', title: 'Douglas 2020 MULTi 1080p x264', original: 'Hannah.Gadsby.Douglas.2020.MULTi.1080p.WEB.H264-OTHER', from: 'refine', proposal: true }

describe('bansOf', () => {
  it('bans every owned release, by its original name and its title', () => {
    expect(bansOf({ releases: [synced], banned_releases: ['Older.Release'] })).toEqual(['Older.Release', synced.original, synced.title])
  })

  it('leaves a pending proposal out of the bans', () => {
    expect(bansOf({ releases: [synced, proposed] })).not.toContain(proposed.original)
  })

  it('does not ban the same release twice', () => {
    expect(bansOf({ releases: [synced], banned_releases: [synced.original] })).toEqual([synced.original, synced.title])
  })
})

describe('isBusy', () => {
  it('tells a movie with a proposal or a swap on its way from an idle one', () => {
    expect(isBusy({ releases: [synced] })).toBe(false)
    expect(isBusy({ releases: [synced, proposed] })).toBe(true)
    expect(isBusy({ releases: [synced, { ...proposed, proposal: false, replaces: [synced.id] }] })).toBe(true)
  })
})

describe('newReportsOf', () => {
  const reports = [
    { id: '1', server, date: 2000 },
    { id: '2', server: 'another', date: 3000 },
    { id: '3', server, date: 1000 },
  ]

  it('keeps the reports of this server made after the cursor', () => {
    expect(newReportsOf(reports, { server, since: 1500 }).map(({ id }) => id)).toEqual(['1'])
  })

  it('keeps nothing on the first run', () => {
    expect(newReportsOf(reports, { server, since: 0 })).toEqual([])
  })
})

describe('cursorOf', () => {
  it('moves to the newest report handled', () => {
    expect(cursorOf([{ date: 2000 }, { date: 3000 }], 1500)).toBe(3000)
    expect(cursorOf([], 1500)).toBe(1500)
  })

  it('starts from now on the first run', () => {
    jest.spyOn(Date, 'now').mockReturnValue(4000)
    expect(cursorOf([], 0)).toBe(4000)
    jest.restoreAllMocks()
  })
})

describe('movieOf', () => {
  const library = [{ id: 1 }, { id: 2, imdb_id: 'tt2' }]

  it('finds the movie by its TMDB guid first, then by its IMDb one', () => {
    expect(movieOf({ type: 'movie', Guid: [{ id: 'imdb://tt2' }, { id: 'tmdb://1' }] }, library)).toBe(library[0])
    expect(movieOf({ type: 'movie', Guid: [{ id: 'imdb://tt2' }] }, library)).toBe(library[1])
  })

  it('matches nothing when neither side has the guid', () => {
    expect(movieOf({ type: 'movie', Guid: [{ id: 'tmdb://3' }] }, library)).toBe(null)
  })

  it('ignores a show, and an item Plex no longer has', () => {
    expect(movieOf({ type: 'show', Guid: [{ id: 'tmdb://1' }] }, library)).toBe(null)
    expect(movieOf(null, library)).toBe(null)
  })
})

describe('reportedOf', () => {
  const report = { id: 'r1', message: 'vo manquante', date: 2000, username: 'friend', server, key: '/library/metadata/1' }

  it('keeps the text, the date and who reported, and bans what the movie owns', () => {
    const reported = reportedOf({ releases: [synced] }, report)

    expect(reported.reports).toEqual([{ id: 'r1', message: 'vo manquante', date: 2000, username: 'friend' }])
    expect(reported.banned_releases).toEqual([synced.original, synced.title])
  })

  it('leaves a movie that already holds the report as it is', () => {
    const reported = reportedOf({ releases: [synced] }, report)

    expect(reportedOf(reported, report)).toBe(reported)
  })

  it('adds a second report to the first one', () => {
    const twice = reportedOf(reportedOf({ releases: [synced] }, report), { ...report, id: 'r2', date: 3000 })

    expect(twice.reports.map(({ id }) => id)).toEqual(['r1', 'r2'])
  })
})

describe('isPending', () => {
  it('waits for a search newer than the latest report', () => {
    expect(isPending({ reports: [{ date: 2000 }] })).toBe(true)
    expect(isPending({ reports: [{ date: 2000 }], reported_at: 2500 })).toBe(false)
    expect(isPending({ reports: [{ date: 2000 }, { date: 3000 }], reported_at: 2500 })).toBe(true)
    expect(isPending({})).toBe(false)
  })
})

describe('replacesOf', () => {
  it('names the Plex versions only', () => {
    expect(replacesOf({ releases: [synced, proposed, { id: 'https://indexer/0', from: 'record' }] })).toEqual([synced.id])
  })
})
