import { settleSwaps, settleSeasonSwaps, proposedSpaceOf, cleanedSpaceOf, OVERDUE_AFTER } from './swaps'

const now = 1790000000000
const old = { id: 'plex://movie/a#1', size: 5864708518 }
const arrived = { id: 'plex://movie/a#2', size: 5657383562 }
const swap = { id: 'https://indexer/1', from: 'refine', size: 5658619392, replaces: [old.id], accepted_at: now - 1000 }
const both = { here: [old, arrived], all: [old, arrived] }

describe('settleSwaps', () => {
  it('removes the replaced versions on the first sync that sees the swap landed', () => {
    const { releases, remove, changed } = settleSwaps([swap], both, { cleanup: true, now })

    expect(remove).toEqual([old.id])
    expect(releases[0]).not.toHaveProperty('replaces')
    expect(changed).toBe(true)
  })

  it('tells, for each version it removes, the version that landed', () => {
    expect(settleSwaps([swap], both, { cleanup: true, now }).landed).toEqual({ [old.id]: { release: swap.id, size: arrived.size } })
  })

  it('points the versions of two items to the same landed swap', () => {
    const twin = { id: 'plex://movie/b#4', size: 9393388028 }
    const replacing = { ...swap, replaces: [old.id, twin.id] }
    const all = [old, twin, arrived]

    expect(settleSwaps([replacing], { here: [old], all }, { cleanup: true, now }).landed[old.id].release).toBe(swap.id)
    expect(settleSwaps([replacing], { here: [twin], all }, { cleanup: true, now }).landed[twin.id].release).toBe(swap.id)
  })

  it('tells nothing landed when cleanup is off', () => {
    expect(settleSwaps([swap], both, { cleanup: false, now }).landed).toEqual({})
  })

  it('removes nothing while the swap has not landed', () => {
    const { releases, remove, changed } = settleSwaps([swap], { here: [old], all: [old] }, { cleanup: true, now })

    expect(remove).toEqual([])
    expect(releases[0].replaces).toEqual(swap.replaces)
    expect(changed).toBe(false)
  })

  it('does not take a new version of another size for the swap', () => {
    const other = { id: 'plex://movie/a#3', size: 1836098560 }

    expect(settleSwaps([swap], { here: [old, other], all: [old, other] }, { cleanup: true, now })).toMatchObject({ remove: [], changed: false })
  })

  it('never takes a version for a swap accepted without a size', () => {
    expect(settleSwaps([{ ...swap, size: 0 }], both, { cleanup: true, now })).toMatchObject({ remove: [], changed: false })
  })

  it('removes the replaced version from its own item when the swap landed in another one', () => {
    expect(settleSwaps([swap], { here: [old], all: [old, arrived] }, { cleanup: true, now }).remove).toEqual([old.id])
    expect(settleSwaps([swap], { here: [arrived], all: [old, arrived] }, { cleanup: true, now })).toMatchObject({ remove: [], changed: false })
  })

  it('ends the swap without removing anything when cleanup is off', () => {
    const { releases, remove } = settleSwaps([swap], both, { cleanup: false, now })

    expect(remove).toEqual([])
    expect(releases[0]).not.toHaveProperty('replaces')
  })

  it('ends the swap when the replaced versions were already deleted by hand', () => {
    const { releases, remove } = settleSwaps([swap], { here: [arrived], all: [arrived] }, { cleanup: true, now })

    expect(remove).toEqual([])
    expect(releases[0]).not.toHaveProperty('replaces')
  })

  it('marks a swap overdue when it has not landed after a week, and clears it once it does', () => {
    const late = { ...swap, accepted_at: now - OVERDUE_AFTER - 1 }
    const overdue = settleSwaps([late], { here: [old], all: [old] }, { cleanup: true, now }).releases[0]

    expect(overdue.overdue).toBe(true)
    expect(settleSwaps([overdue], both, { cleanup: true, now }).releases[0]).not.toHaveProperty('overdue')
  })
})

describe('settleSeasonSwaps', () => {
  const version = (id, name, size, extra = {}) => ({ id, file: `/data/tvshows/Friends/Season 05/${name}`, name, size, ratingKey: id, media: 1, ...extra })
  const olds = [1, 2].map((episode) => version(`plex://episode/5-${episode}#1`, `Friends.S05E0${episode}.720p.mkv`, 300))
  const news = [1, 2].map((episode) => version(`plex://episode/5-${episode}#2`, `Friends.S05E0${episode}.1080p.mkv`, 700))
  const swap = {
    id: 'https://indexer/2',
    swap: true,
    size: 1500,
    coverage: [{ season: 5, episode: 1 }, { season: 5, episode: 2 }],
    replaces: olds.map(({ id }) => id),
    accepted_at: now - 1000,
    torrent: { name: 'Friends.S05', files: [1, 2].map((episode) => ({ path: `Friends.S05/Friends.S05E0${episode}.1080p.mkv`, size: 700 })) },
  }
  const landed = { '5:1': [olds[0], news[0]], '5:2': [olds[1], news[1]] }

  it('deletes the replaced versions once every covered episode has one of its files on Plex, and ends the swap', () => {
    const { settled, remove } = settleSeasonSwaps([swap], landed, { cleanup: true, now })

    expect(remove).toEqual(olds.map((version) => ({ version, landed: { release: swap.id, size: 1400 } })))
    expect(settled).toEqual([{ release: swap, fields: { replaces: [], overdue: false } }])
  })

  it('deletes nothing while one covered episode still waits for its file', () => {
    const { settled, remove } = settleSeasonSwaps([swap], { ...landed, '5:2': [olds[1]] }, { cleanup: true, now })

    expect(remove).toEqual([])
    expect(settled).toEqual([])
  })

  it('reads a version as the swap only when it is a file of its torrent, not a same sized one', () => {
    const other = version('plex://episode/5-2#3', 'Friends.S05E02.WEB.mkv', 700)

    expect(settleSeasonSwaps([swap], { ...landed, '5:2': [olds[1], other] }, { cleanup: true, now }).remove).toEqual([])
  })

  it('ends a landed swap without deleting anything when cleanup is off', () => {
    const { settled, remove } = settleSeasonSwaps([swap], landed, { cleanup: false, now })

    expect(remove).toEqual([])
    expect(settled[0].fields).toEqual({ replaces: [], overdue: false })
  })

  it('marks overdue a swap that has not landed a week after it was accepted, once', () => {
    const late = { ...swap, accepted_at: now - OVERDUE_AFTER - 1 }

    expect(settleSeasonSwaps([late], { '5:1': [olds[0]], '5:2': [olds[1]] }, { cleanup: true, now }).settled).toEqual([{ release: late, fields: { overdue: true } }])
    expect(settleSeasonSwaps([{ ...late, overdue: true }], { '5:1': [olds[0]], '5:2': [olds[1]] }, { cleanup: true, now }).settled).toEqual([])
  })

  it('leaves an ended swap and a release that is not a swap', () => {
    expect(settleSeasonSwaps([{ ...swap, replaces: [] }, { ...swap, swap: undefined }], landed, { cleanup: true, now })).toEqual({ settled: [], remove: [] })
    expect(settleSeasonSwaps(undefined, landed, { cleanup: true, now })).toEqual({ settled: [], remove: [] })
  })
})

describe('proposedSpaceOf', () => {
  const sarah = { releases: [{ from: 'sync', size: 9393388028 }], release: { size: 5587867192 } }

  it('sums, over the proposals, the proposed size minus every Plex file of the movie', () => {
    const twice = { releases: [{ from: 'sync', size: 4000000000 }, { from: 'sync', size: 3000000000 }, { from: 'refine', size: 1 }], release: { size: 5000000000 } }

    expect(proposedSpaceOf([sarah, twice])).toEqual({ proposed: (5587867192 - 9393388028) + (5000000000 - 7000000000) })
  })

  it('tells nothing when no proposal has a file on Plex to compare with', () => {
    expect(proposedSpaceOf([{ releases: [], release: { size: 1 } }])).toEqual({})
  })
})

describe('cleanedSpaceOf', () => {
  it('sums every deleted version, and a swap landed for versions of two Plex items once', () => {
    const landed = { release: swap.id, size: arrived.size }

    expect(cleanedSpaceOf([{ size: old.size, landed }, { size: 9393388028, landed }])).toEqual({ deleted: old.size + 9393388028, arrived: arrived.size })
  })
})
