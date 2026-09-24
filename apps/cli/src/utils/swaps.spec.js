import { settleSwaps, spaceOf, OVERDUE_AFTER } from './swaps'

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

describe('spaceOf', () => {
  // Sans Sarah, rien ne va !, proposed by the shrink job in4fjcb on 2026-09-20
  const sarah = { releases: [{ from: 'sync', size: 9393388028 }], release: { size: 5587867192 } }

  it('sums, over the proposals, the proposed size minus every Plex file of the movie', () => {
    const twice = { releases: [{ from: 'sync', size: 4000000000 }, { from: 'sync', size: 3000000000 }, { from: 'refine', size: 1 }], release: { size: 5000000000 } }

    expect(spaceOf([sarah, twice])).toEqual({ proposed: (5587867192 - 9393388028) + (5000000000 - 7000000000) })
  })

  it('tells nothing when no proposal has a file on Plex to compare with', () => {
    expect(spaceOf([{ releases: [], release: { size: 1 } }])).toEqual({})
  })
})
