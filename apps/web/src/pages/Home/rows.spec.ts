import { rowsOf, listsOf, dropRow, compareOf, pruned, LOCKED, List } from './rows'

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

describe('groups', () => {
  const row = (id, hidden = false) => ({ id, hidden })

  it('makes a group of a row dropped on the middle of another', () => {
    expect(dropRow([row('a'), row('b'), row('c')], 'c', 'a', 'group', 'group:g')).toEqual([{ id: 'group:g', hidden: false, tabs: ['a', 'c'] }, row('b')])
  })

  it('adds a row to a group, beside the tab it is dropped on', () => {
    const rows = [{ id: 'group:g', hidden: false, tabs: ['a', 'b'] }, row('c')]

    expect(dropRow(rows, 'c', 'group:g', 'group', 'group:h')).toEqual([{ id: 'group:g', hidden: false, tabs: ['a', 'b', 'c'] }])
    expect(dropRow(rows, 'c', 'a', 'after', 'group:h')).toEqual([{ id: 'group:g', hidden: false, tabs: ['a', 'c', 'b'] }])
  })

  it('takes a tab out of its group on an edge, and a group of one tab is that row again', () => {
    const rows = [{ id: 'group:g', hidden: false, tabs: ['a', 'b'] }, row('c')]

    expect(dropRow(rows, 'b', 'c', 'after', 'group:h')).toEqual([row('a'), row('c'), row('b')])
  })

  it('moves a group but never nests it, and leaves the tabbed row out of groups', () => {
    const rows = [{ id: 'group:g', hidden: false, tabs: ['a', 'b'] }, row('c'), row('discover_selectable')]

    expect(dropRow(rows, 'group:g', 'c', 'group', 'group:h')).toEqual([row('c'), { id: 'group:g', hidden: false, tabs: ['a', 'b'] }, row('discover_selectable')])
    expect(dropRow(rows, 'discover_selectable', 'c', 'group', 'group:h')).toEqual([{ id: 'group:g', hidden: false, tabs: ['a', 'b'] }, row('c'), row('discover_selectable')])
  })

  it('keeps a group holding a locked row shown, and counts that row as there', () => {
    const rows = rowsOf('movie', [{ id: 'group:g', hidden: true, tabs: ['swaps', 'list:w'] }], lists)

    expect(rows[0]).toEqual({ id: 'group:g', hidden: false, tabs: ['swaps', 'list:w'] })
    expect(rows.filter(({ id }) => id === 'swaps')).toHaveLength(0)
  })
})

describe('compareOf', () => {
  const list = (descending): List => ({ id: 's', name: 'Sorted', media: 'movie', sort: { by: 'release_date', descending }, sources: [] })
  const movies = [{ release_date: '1999-01-01' }, { release_date: null }, { release_date: '2010-01-01' }]

  it('puts a movie without the field where Mongo does, first ascending and last descending', () => {
    expect([...movies].sort(compareOf(list(false))).map(({ release_date }) => release_date)).toEqual([null, '1999-01-01', '2010-01-01'])
    expect([...movies].sort(compareOf(list(true))).map(({ release_date }) => release_date)).toEqual(['2010-01-01', '1999-01-01', null])
  })
})

describe('pruned', () => {
  it('takes a deleted list out of the Home and out of its group, a group of one tab back to that row', () => {
    const rows = [{ id: 'list:a', hidden: false }, { id: 'group:g', hidden: false, tabs: ['trending_movies', 'list:a'] }, { id: 'list:b', hidden: true }]

    expect(pruned(rows, ['list:b'])).toEqual([{ id: 'trending_movies', hidden: false }, { id: 'list:b', hidden: true }])
  })
})
