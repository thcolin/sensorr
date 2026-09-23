import { settleSwaps, OVERDUE_AFTER } from './swaps'

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
