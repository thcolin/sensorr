import { settleSwaps, OVERDUE_AFTER } from './swaps'

const now = 1790000000000
const old = { id: 'plex://movie/a#1', from: 'sync', size: 5864708518 }
const swap = { id: 'https://indexer/1', from: 'refine', size: 5658619392, replaces: ['plex://movie/a#1'], accepted_at: now - 1000 }

describe('settleSwaps', () => {
  it('removes the replaced version once the swap has landed', () => {
    const versions = [{ id: 'plex://movie/a#1', size: old.size }, { id: 'plex://movie/a#2', size: 5657383562 }]
    const { releases, remove, changed } = settleSwaps([swap, old], versions, { cleanup: true, now })

    expect(remove).toEqual(['plex://movie/a#1'])
    expect(releases[0]).not.toHaveProperty('replaces')
    expect(changed).toBe(true)
  })

  it('removes nothing while the swap has not landed', () => {
    const { releases, remove, changed } = settleSwaps([swap, old], [{ id: 'plex://movie/a#1', size: old.size }], { cleanup: true, now })

    expect(remove).toEqual([])
    expect(releases[0].replaces).toEqual(swap.replaces)
    expect(changed).toBe(false)
  })

  it('does not take a new version of another size for the swap', () => {
    const versions = [{ id: 'plex://movie/a#1', size: old.size }, { id: 'plex://movie/a#3', size: 1836098560 }]

    expect(settleSwaps([swap], versions, { cleanup: true, now }).remove).toEqual([])
  })

  it('keeps the replaced version when cleanup is off', () => {
    const versions = [{ id: 'plex://movie/a#1', size: old.size }, { id: 'plex://movie/a#2', size: 5657383562 }]
    const { releases, remove } = settleSwaps([swap], versions, { cleanup: false, now })

    expect(remove).toEqual([])
    expect(releases[0].replaces).toEqual(swap.replaces)
  })

  it('marks a swap overdue when it has not landed after a week, and clears it once it does', () => {
    const late = { ...swap, accepted_at: now - OVERDUE_AFTER - 1 }
    const overdue = settleSwaps([late], [{ id: 'plex://movie/a#1', size: old.size }], { cleanup: true, now }).releases[0]

    expect(overdue.overdue).toBe(true)

    const landed = settleSwaps([overdue], [{ id: 'plex://movie/a#2', size: 5657383562 }], { cleanup: false, now }).releases[0]

    expect(landed).not.toHaveProperty('overdue')
  })
})
