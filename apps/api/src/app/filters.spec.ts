import { episodeStatusFilter, movieFilter, oneOf, releasesFilter, showFilter, upcomingBirthdayFilter } from './filters'

describe('oneOf', () => {
  it('matches any value on a pipe, every value on a comma, cast', () => {
    expect(oneOf('18|35', 'genres.id', Number)).toEqual({ 'genres.id': { $in: [18, 35] } })
    expect(oneOf('18,35', 'genres.id', Number)).toEqual({ 'genres.id': { $all: [18, 35] } })
    expect(oneOf(undefined, 'genres.id')).toEqual({})
  })
})

describe('releasesFilter', () => {
  it('adds nothing without a release parameter', () => {
    expect(releasesFilter({ genres: '18' })).toEqual({})
  })

  it('looks for a preferred tag on the proposal when proposals are asked for', () => {
    expect(releasesFilter({ 'releases.proposal': 'true', 'release_resolution.prefer': '2160p', 'release_size.lte': '4' })).toEqual({
      $and: [
        { releases: { $elemMatch: { proposal: true } } },
        { releases: { $elemMatch: { title: { $regex: '2160p' }, proposal: true } } },
        { releases: { $elemMatch: { size: { $lte: 4 * Math.pow(1024, 3) } } } },
      ],
    })
  })
})

describe('movieFilter', () => {
  it('combines companies with AND on the companies themselves', () => {
    expect(movieFilter({ production_companies: 'A24,Pixar', spoken_languages: 'fr' })).toMatchObject({
      'production_companies.name': { $all: ['A24', 'Pixar'] },
      'spoken_languages.iso_639_1': { $in: ['fr'] },
    })
  })

  it('scales the budget to millions and casts the dates', () => {
    expect(movieFilter({ 'budget.gte': '10', 'release_date.lte': '2000-01-01T00:00:00.000Z' })).toMatchObject({
      budget: { $gte: 10000000 },
      release_date: { $lte: new Date('2000-01-01T00:00:00.000Z') },
    })
  })
})

describe('showFilter', () => {
  it('filters on what TMDB tells of a show, ids cast to numbers', () => {
    expect(showFilter({ networks: '49|213', type: 'Scripted|Miniseries', origin_country: 'GB', 'number_of_seasons.lte': '2', monitored: 'true' })).toEqual({
      state: { $nin: ['ignored'] },
      monitored: true,
      type: { $in: ['Scripted', 'Miniseries'] },
      'networks.id': { $in: [49, 213] },
      origin_country: { $in: ['GB'] },
      number_of_seasons: { $lte: 2 },
    })
  })

  it('matches an episode length on any of the lengths a show lists', () => {
    expect(showFilter({ 'episode_run_time.gte': '20', 'episode_run_time.lte': '30' })).toMatchObject({
      episode_run_time: { $elemMatch: { $gte: 20, $lte: 30 } },
    })
  })

  it('keeps the proposal filter the library already sent', () => {
    expect(showFilter({ 'releases.proposal': 'false' })).toMatchObject({
      $and: [{ releases: { $not: { $elemMatch: { proposal: true } } } }],
    })
  })
})

describe('episodeStatusFilter', () => {
  const now = new Date('2026-09-29T00:00:00.000Z')

  it('matches any of the statuses asked for', () => {
    expect(episodeStatusFilter('owned|wanted', now)).toEqual({
      $or: [
        { 'files.0': { $exists: true } },
        { 'files.0': { $exists: false }, monitored: true, air_date: { $lte: now }, release: { $in: [null, ''] } },
      ],
    })
  })

  it('adds nothing for no status, or an unknown one', () => {
    expect(episodeStatusFilter(undefined, now)).toEqual({})
    expect(episodeStatusFilter('missing', now)).toEqual({})
  })
})

describe('a query string parsed into arrays or objects', () => {
  it('filters on none of them, and reads no prototype key', () => {
    expect(showFilter({ networks: ['49'], status: { $ne: 'Ended' }, type: 'Scripted' })).toEqual({ state: { $nin: ['ignored'] }, type: { $in: ['Scripted'] } })
    expect(movieFilter({ genres: { $gt: '' } })).toEqual({ state: { $nin: ['ignored'] } })
    expect(episodeStatusFilter({ $ne: 'owned' }, new Date())).toEqual({})
    expect(episodeStatusFilter('__proto__', new Date())).toEqual({})
    expect(showFilter({ monitored: 'constructor', 'releases.proposal': '__proto__' })).toEqual({ state: { $nin: ['ignored'] } })
  })
})

describe('upcomingBirthdayFilter', () => {
  const month = (m, d) => ({ $expr: { $and: [{ $eq: [{ $month: '$birthday' }, m] }, { $eq: [{ $dayOfMonth: '$birthday' }, d] }] } })

  it('matches the month and day of each day ahead, across the new year', () => {
    expect(upcomingBirthdayFilter('3', new Date('2026-12-30T18:00:00.000Z'))).toEqual({
      $or: [month(12, 30), month(12, 31), month(1, 1)],
    })
  })

  it('adds nothing without a positive number of days', () => {
    expect(upcomingBirthdayFilter(undefined, new Date())).toEqual({})
    expect(upcomingBirthdayFilter('0', new Date())).toEqual({})
    expect(upcomingBirthdayFilter('soon', new Date())).toEqual({})
  })
})
