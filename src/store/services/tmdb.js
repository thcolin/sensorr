import qs from 'query-string'

class TMDB {
  constructor({ key }) {
    this.key = key
    this.base = 'https://api.themoviedb.org/3/'
  }

  build(uri, params = {}) {
    params.language = localStorage.getItem('language')
    params.api_key = this.key

    return `${this.base}${uri.join('/')}?${qs.stringify(params)}`
  }

  fetch(uri, params = {}) {
    return fetch(this.build(uri, params)).then(res => res.json())
  }
}

export default new TMDB({ key: process.env.TMDB_API_KEY })

export const GENRES = {
  28: 'Action',
  12: 'Aventure',
  16: 'Animation',
  35: 'Comédie',
  80: 'Crime',
  99: 'Documentaire',
  18: 'Drame',
  10751: 'Familial',
  14: 'Fantastique',
  36: 'Histoire',
  27: 'Horreur',
  10402: 'Musique',
  9648: 'Mystère',
  10749: 'Romance',
  878: 'Science-Fiction',
  10770: 'Téléfilm',
  53: 'Thriller',
  10752: 'Guerre',
  37: 'Western',
}
