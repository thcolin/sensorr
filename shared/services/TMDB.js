const qs = require('query-string')

module.exports = class TMDB {
  constructor({ key, adult, region = 'en-US' }) {
    this.key = key
    this.region = region
    this.adult = !!adult
    this.base = 'https://api.themoviedb.org/3/'
  }

  build(uri, params = {}) {
    const query = {
      ...params,
      language: this.region,
      api_key: this.key,
      include_adult: this.adult,
    }

    return `${this.base}${uri.join('/')}?${qs.stringify(query)}`
  }

  fetch(uri, params = {}) {
    return fetch(this.build(uri, params))
      .then(res => {
        return new Promise((resolve, reject) => {
          try {
            res.json().then(body => {
              if (res.ok) {
                resolve(body)
              } else {
                reject(body)
              }
            })
          } catch(e) {
            reject(e)
          }
        })
      })
  }
}

module.exports.GENRES = {
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
