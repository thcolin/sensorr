import { Sensorr } from './sensorr'

describe('Sensorr.getQuery', () => {
  const sensorr = new Sensorr({ region: 'fr-FR' })

  it('gives the movie titles, the terms no other title contains and the release years', () => {
    const movie = {
      title: 'La Haine',
      original_title: 'La Haine',
      release_date: '1995-05-31',
      alternative_titles: {
        titles: [
          { iso_3166_1: 'US', title: 'Hate', type: '' },
          { iso_3166_1: 'FR', title: 'La Haine (1995)', type: '' },
          { iso_3166_1: 'US', title: 'Haine, La', type: 'Alphabetical' },
          { iso_3166_1: 'DE', title: 'Hass', type: '' },
        ],
      },
      release_dates: { results: [{ iso_3166_1: 'US', release_dates: [{ type: 2, release_date: '1996-02-23' }] }] },
    }

    expect(sensorr.getQuery(movie, null, ['banned'])).toEqual({
      _defaults: { titles: ['la haine', 'hate', 'la haine 1995'], terms: ['la haine', 'hate'], years: ['1995', '1996'] },
      banned_releases: ['banned'],
      titles: ['la haine', 'hate', 'la haine 1995'],
      terms: ['la haine', 'hate'],
      years: ['1995', '1996'],
    })
  })

  it('keeps a saved query only when it has titles, terms and years', () => {
    const movie = { title: 'La Haine', release_date: '1995-05-31' }

    expect(sensorr.getQuery(movie, { titles: ['x'], terms: ['x'], years: ['2000'] })).toMatchObject({ terms: ['x'], years: ['2000'] })
    expect(sensorr.getQuery(movie, { titles: ['x'], terms: ['x'], years: [] })).toMatchObject({ terms: ['la haine'], years: ['1995'] })
  })
})
