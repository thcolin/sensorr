import TMDB from 'shared/services/TMDB'

const tmdb = new TMDB({
  key: global.config.tmdb,
  region: global.config.region || localStorage.getItem('region') || 'en-US',
  adult: global.config.adult,
})

export default tmdb
