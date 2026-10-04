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
    const config = loaded({ lists: [{ id: 'a1', name: 'Western', media: 'movie', sources: [{ kind: 'discover', values }, { kind: 'manual' }] }] })

    expect(config.get('lists')[0].sources).toEqual([{ kind: 'discover', values }, { kind: 'manual' }])
  })

  it('refuses two lists with the same id', () => {
    expect(() => loaded({ lists: [{ id: 'a', name: 'x', media: 'movie', sources: [] }, { id: 'a', name: 'y', media: 'tv', sources: [] }] })).toThrow('own id')
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

  it('changes one Home without touching the others', () => {
    const config = loaded({ home: { tv: [{ id: 'airing', hidden: true }] } })

    expect(config.get('home.tv')).toEqual([{ id: 'airing', hidden: true }])
    expect(config.get('home.movie')).toHaveLength(9)
  })
})
