import { Show, Season } from '../interfaces'

export const show = {
  id: 1399,
  name: 'Game of Thrones',
  original_name: 'Game of Thrones',
  original_language: 'en',
  overview: 'Seven noble families fight for control of the mythical land of Westeros.',
  first_air_date: '2011-04-17',
  last_air_date: '2019-05-19',
  status: 'Ended',
  type: 'Scripted',
  in_production: false,
  number_of_seasons: 8,
  number_of_episodes: 73,
  episode_run_time: [60],
  genres: [
    { id: 10765, name: 'Sci-Fi & Fantasy' },
    { id: 18, name: 'Drama' },
  ],
  networks: [
    { id: 49, name: 'HBO', logo_path: '/tuomPhY2UtuPTqqFnKMVHvSb724.png' },
  ],
  origin_country: ['US'],
  poster_path: '/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg',
  backdrop_path: '/suopoADq0k8YZr4dQXcU6pToj6s.jpg',
  popularity: 369.594,
  vote_average: 8.4,
  vote_count: 21390,
  external_ids: {
    imdb_id: 'tt0944947',
    tvdb_id: 121361,
  },
  alternative_titles: {
    results: [
      { iso_3166_1: 'FR', title: 'Le Trône de fer' },
    ],
  },
  seasons: [
    { id: 3624, season_number: 1, name: 'Season 1', episode_count: 10, air_date: '2011-04-17', poster_path: '/wgfKiqzuMrFIkU1M68DDDY8kGC1.jpg' },
    { id: 3625, season_number: 2, name: 'Season 2', episode_count: 10, air_date: '2012-04-01', poster_path: '/qYVDVOgYBnzqSNTBqB4kzp1sQjt.jpg' },
  ],
  // Extra fields TMDB returns on `tv/{id}` that a stored show does not keep
  homepage: 'http://www.hbo.com/game-of-thrones',
  tagline: 'Winter Is Coming',
} as unknown as Show

export const season = {
  id: 3624,
  season_number: 1,
  name: 'Season 1',
  air_date: '2011-04-17',
  poster_path: '/wgfKiqzuMrFIkU1M68DDDY8kGC1.jpg',
  episodes: [
    {
      id: 63056,
      season_number: 1,
      episode_number: 1,
      name: 'Winter Is Coming',
      overview: 'Jon Arryn, the Hand of the King, is dead.',
      air_date: '2011-04-17',
      runtime: 62,
      still_path: '/wrGWeW4WKxnaeA8sxJb2T9O6ryo.jpg',
    },
    {
      id: 63057,
      season_number: 1,
      episode_number: 2,
      name: 'The Kingsroad',
      overview: 'While Bran recovers from his fall, Ned takes Jon Arryn.',
      air_date: '2011-04-24',
      runtime: 56,
      still_path: '/pmveTPjEDpq2rZI9CywV5o1LR86.jpg',
    },
  ],
} as Season

// `genre/tv/list`, which shares only some ids with `genre/movie/list`
export const tvGenres = [
  { id: 10759, name: 'Action & Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 10762, name: 'Kids' },
  { id: 9648, name: 'Mystery' },
  { id: 10763, name: 'News' },
  { id: 10764, name: 'Reality' },
  { id: 10765, name: 'Sci-Fi & Fantasy' },
  { id: 10766, name: 'Soap' },
  { id: 10767, name: 'Talk' },
  { id: 10768, name: 'War & Politics' },
  { id: 37, name: 'Western' },
]

export default {
  show,
  season,
  tvGenres,
}
