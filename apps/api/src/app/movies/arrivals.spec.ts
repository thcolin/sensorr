import { arrivedOf } from './arrivals'

describe('arrivedOf', () => {
  it('dates a known movie the first time sync gives it a Plex link', () => {
    expect(arrivedOf({ 1: { plex_url: 'plex://1' } }, [{ _id: 1 }])).toEqual(['1'])
  })

  it('never dates a grab, a movie already on Plex, one dated before, or one sync adds from Plex', () => {
    expect(arrivedOf({
      1: {},
      2: { plex_url: 'plex://2' },
      3: { plex_url: 'plex://3' },
      4: { plex_url: 'plex://4' },
    }, [{ _id: 1 }, { _id: 2, plex_url: 'plex://2' }, { _id: 3, archived_at: 1 }])).toEqual([])
  })
})
