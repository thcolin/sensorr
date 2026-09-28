import { queryOf, setsOf, typeOf } from './sets'

describe('setsOf', () => {
  it('reads a set, its poster and its backdrop, the thumbnail and the JPEG Plex fetches', () => {
    expect(setsOf({
      item: {
        sets: [
          { id: 42, set_title: 'The Matrix (1999) Set', user_created: { username: 'r3draid3r04' }, poster: [{ id: '52ba1706', modified_on: '2024-03-05T10:11:12.000Z' }], backdrop: [] },
          { id: 43, set_title: 'Empty', user_created: null, poster: [], backdrop: null },
        ],
      },
    })).toEqual([{
      id: '42',
      title: 'The Matrix (1999) Set',
      author: 'r3draid3r04',
      poster: { thumb: 'https://images.mediux.io/assets/52ba1706?v=20240305101112&key=thumb', url: 'https://images.mediux.io/assets/52ba1706?v=20240305101112&key=jpg' },
      backdrop: null,
    }])
  })

  it('has no set for a title MediUX does not know', () => {
    expect(setsOf({ item: null })).toEqual([])
    expect(setsOf(null)).toEqual([])
  })
})

describe('typeOf', () => {
  it('takes a movie or a show only', () => {
    expect(typeOf('tv')).toBe('tv')
    expect(typeOf('person')).toBeNull()
  })
})

describe('queryOf', () => {
  it('asks for the sets of one title', () => {
    expect(queryOf('movie', 603).variables).toEqual({ id: '603' })
  })
})
