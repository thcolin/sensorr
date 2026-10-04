import { rowsOf, LOCKED, List } from './rows'

const lists: List[] = [
  { id: 'w', name: 'Westerns', media: 'movie', sources: [{ kind: 'discover', values: {} }] },
  { id: 's', name: 'Sitcoms', media: 'tv', sources: [{ kind: 'manual' }] },
]

describe('rowsOf', () => {
  it('keeps the order and the hidden rows of the browser Home', () => {
    const rows = [{ id: 'list:s', hidden: false }, { id: 'swaps', hidden: true }, { id: 'requests', hidden: false }]

    expect(rowsOf('all', rows, lists)).toEqual(rows)
  })

  it('drops the rows of a deleted list or an unknown id', () => {
    expect(rowsOf('all', [{ id: 'list:gone', hidden: false }, { id: 'nope', hidden: false }, { id: 'airing', hidden: false }], lists)).toEqual([{ id: 'airing', hidden: false }])
  })

  it('drops from a PWA Home the rows of the other media', () => {
    const rows = rowsOf('tv', [{ id: 'list:w', hidden: false }, { id: 'requests', hidden: false }, { id: 'list:s', hidden: false }], lists)

    expect(rows.map(({ id }) => id)).toEqual(['list:s', ...LOCKED.tv])
  })

  it('shows a locked row even hidden, and puts a missing one back at the end', () => {
    const rows = rowsOf('movie', [{ id: 'swaps', hidden: true }], lists)

    expect(rows[0]).toEqual({ id: 'swaps', hidden: false })
    expect(rows.map(({ id }) => id).sort()).toEqual([...LOCKED.movie].sort())
  })
})
