import { translatorOf } from '@sensorr/i18n/server'
import { arrivalsOf } from './arrivals'

const t = translatorOf({ region: 'en-US' })

describe('arrivalsOf', () => {
  it('lists each movie, and each show once with the episodes that landed, the latest first', () => {
    const arrivals = arrivalsOf(t, {
      movies: [{ title: 'Dune', release_date: '2021-09-15', poster_path: '/dune.jpg', archived_at: 2 }],
      shows: [{ _id: 1, name: 'Andor', poster_path: '/andor.jpg' }, { _id: 2, name: 'Severance' }, { _id: 3, name: 'Nothing landed' }],
      episodes: [
        { show_id: 1, season_number: 2, files_at: 3 },
        { show_id: 1, season_number: 2, files_at: 1 },
        { show_id: 2, season_number: 1, files_at: 1 },
        { show_id: 2, season_number: 2, files_at: 1 },
      ],
    })

    expect(arrivals).toEqual([
      { title: 'Andor', detail: 'Season 2 · 2 episodes', poster: 'https://image.tmdb.org/t/p/w342/andor.jpg' },
      { title: 'Dune', detail: '2021', poster: 'https://image.tmdb.org/t/p/w342/dune.jpg' },
      { title: 'Severance', detail: '2 episodes', poster: undefined },
    ])
  })

  it('is empty when nothing landed', () => {
    expect(arrivalsOf(t, { movies: [], shows: [{ _id: 1, name: 'Andor' }], episodes: [] })).toEqual([])
  })
})
