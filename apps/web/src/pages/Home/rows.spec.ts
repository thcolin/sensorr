import { rowsOf, listsOf, LOCKED, List } from './rows'

// `@sensorr/utils` reaches ESM that this jest setup leaves untransformed
jest.mock('@dicebear/core', () => ({}))
jest.mock('@dicebear/collection', () => ({}))

const lists: List[] = [
  { id: 'w', name: 'Westerns', media: 'movie', sources: [{ kind: 'discover', values: {} }] },
  { id: 's', name: 'Sitcoms', media: 'tv', sources: [{ kind: 'custom' }] },
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

describe('listsOf', () => {
  it('brings back as dates the dates config.json keeps as strings', () => {
    const saved = [{ id: 'd', name: 'Nineties', media: 'movie', sources: [{ kind: 'discover', values: { primary_release_date: ['1990-01-01T00:00:00.000Z', '1999-12-31T00:00:00.000Z'] } }] }]
    const [list] = listsOf({ get: () => saved })

    expect(list.sources[0].values.primary_release_date[0]).toBeInstanceOf(Date)
    expect(list.sources[0].values.primary_release_date[1].toISOString()).toBe('1999-12-31T00:00:00.000Z')
  })
})
