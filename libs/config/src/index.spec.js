import { create } from './index'

const loaded = (raw) => {
  const config = create()
  config.load({ vapidPublicKey: 'key', ...raw })
  config.validate({ allowed: 'warn', output: () => {} })
  return config
}

describe('lists', () => {
  it('keeps the values of the filters panel as they were saved', () => {
    const values = { with_genres: { behavior: 'or', values: [{ value: 37, label: 'Western' }] } }
    const config = loaded({ lists: [{ id: 'a1', name: 'Western', media: 'movie', sources: [{ kind: 'discover', values }, { kind: 'custom' }] }] })

    expect(config.get('lists')[0].sources).toEqual([{ kind: 'discover', values }, { kind: 'custom' }])
  })

  it('refuses two lists with the same id', () => {
    expect(() => loaded({ lists: [{ id: 'a', name: 'x', media: 'movie', sources: [] }, { id: 'a', name: 'y', media: 'tv', sources: [] }] })).toThrow('own id')
  })

  it('sorts a list on a known field only', () => {
    const list = (sort) => ({ id: 'a', name: 'x', media: 'movie', sort, sources: [] })

    expect(loaded({ lists: [list({ by: 'popularity', descending: true }), { ...list(null), id: 'b' }] }).get('lists')).toHaveLength(2)
    expect(() => loaded({ lists: [list({ by: 'title', descending: true })] })).toThrow('sort')
    expect(() => loaded({ lists: [list({ by: '__proto__', descending: false })] })).toThrow('sort')
  })

  it('refuses a list mixing media', () => {
    expect(() => loaded({ lists: [{ id: 'a', name: 'x', media: 'person', sources: [] }] })).toThrow('media')
  })
})

describe('home', () => {
  it('starts on the rows the Homes had before they were configurable', () => {
    const config = loaded({})

    expect(config.get('home.all')).toHaveLength(13)
    expect(config.get('home.movie')).toHaveLength(9)
    expect(config.get('home.tv')).toHaveLength(5)
  })

  it('keeps a group of rows as it was saved', () => {
    const config = loaded({ home: { all: [{ id: 'group:g', hidden: false, tabs: ['trending_movies', 'list:a1'] }, { id: 'airing', hidden: false }] } })

    expect(config.get('home.all')).toEqual([{ id: 'group:g', hidden: false, tabs: ['trending_movies', 'list:a1'] }, { id: 'airing', hidden: false }])
  })

  it('changes one Home without touching the others', () => {
    const config = loaded({ home: { tv: [{ id: 'airing', hidden: true }] } })

    expect(config.get('home.tv')).toEqual([{ id: 'airing', hidden: true }])
    expect(config.get('home.movie')).toHaveLength(9)
  })
})
