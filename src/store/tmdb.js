import TMDB from 'shared/services/TMDB'

const tmdb = new TMDB({ key: global.config.tmdb })

export default tmdb
