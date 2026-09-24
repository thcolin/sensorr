import { bansOf, isBusy, newReportsOf, cursorOf } from './reports'

const server = 'c17e95cd787ad46b050ebcff895a4b88d25f2d23'
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
    expect(cursorOf([], 0)).toBeGreaterThan(1790000000000)
  })
})
