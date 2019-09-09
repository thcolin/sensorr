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
  12: 'Aventure',
  14: 'Fantastique',
  16: 'Animation',
  18: 'Drame',
  27: 'Horreur',
  28: 'Action',
  35: 'Comédie',
  36: 'Histoire',
  37: 'Western',
  53: 'Thriller',
  80: 'Crime',
  99: 'Documentaire',
  878: 'Science-Fiction',
  9648: 'Mystère',
  10402: 'Musique',
  10749: 'Romance',
  10751: 'Familial',
  10752: 'Guerre',
  10770: 'Téléfilm',
}

module.exports.STUDIOS = {
  "Disney": [
    {
      id: 3166,
      name: "Walt Disney Productions",
      sort: "popularity.desc"
    },
    {
      id: 2,
      name: "Walt Disney Pictures",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 6125,
      name: "Walt Disney Animation Studios",
      sort: "popularity.desc"
    },
    {
      id: 1,
      name: "Lucasfilm",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 108270,
      name: "Lucasfilm Animation",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 7505,
      name: "Marvel Entertainment",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 19551,
      name: "Marvel Enterprises",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 420,
      name: "Marvel Studios",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 13252,
      name: "Marvel Animation",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 3,
      name: "Pixar",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 32,
      name: "Buena Vista",
      sort: "popularity.desc"
    },
    {
      id: 9195,
      name: "Touchstone Pictures",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 113635,
      name: "Vice Studios",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 17209,
      name: "Vice Films",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 14,
      name: "Miramax",
      sort: "primary_release_date.desc|popularity.desc"
    }
  ],
  "Warner": [
    {
      id: 17,
      name: "Warner Bros. Entertainment",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 174,
      name: "Warner Bros. Pictures",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 12,
      name: "New Line Cinema",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 7899,
      name: "Cartoon Network Studios",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 25120,
      name: "Warner Animation Group",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 2785,
      name: "Warner Bros. Animation",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 97,
      name: "Castle Rock Entertainment",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 7429,
      name: "HBO Films",
      sort: "primary_release_date.desc|popularity.desc"
    }
  ],
  "Universal": [
    {
      id: 33,
      name: "Universal Pictures",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 5726,
      name: "Universal Pictures International (UPI)",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 10146,
      name: "Focus Features",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 37,
      name: "Gramercy Pictures",
      sort: "popularity.desc"
    },
    {
      id: 7,
      name: "DreamWorks",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 521,
      name: "DreamWorks Animation",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 6704,
      name: "Illumination Entertainment",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 6196,
      name: "Carnival Films",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 10163,
      name: "Working Title Films",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 56,
      name: "Amblin Entertainment",
      sort: "primary_release_date.desc|popularity.desc"
    }
  ],
  "Fox": [
    {
      id: 25,
      name: "20th Century Fox",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 112148,
      name: "20th Century Fox Korea",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 18065,
      name: "20th Century Fox Russia",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 43,
      name: "Fox Searchlight Pictures",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 711,
      name: "Fox 2000 Pictures",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 11749,
      name: "Twentieth Century Fox Animation",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 9383,
      name: "Blue Sky Studios",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 12154,
      name: "Fox Star Studios",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 508,
      name: "Regency Enterprises",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 10104,
      name: "New Regency Pictures",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 16880,
      name: "Shine Pictures",
      sort: "primary_release_date.desc|popularity.desc"
    }
  ],
  "Sony": [
    {
      id: 34,
      name: "Sony Pictures",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 58,
      name: "Sony Pictures Classics",
      sort: "popularity.desc"
    },
    {
      id: 2251,
      name: "Sony Pictures Animation",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 3045,
      name: "Sony Pictures Releasing",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 30692,
      name: "Sony Pictures Imageworks (SPI)",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 5,
      name: "Columbia Pictures",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 106728,
      name: "Columbia Pictures Corporation",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 3287,
      name: "Screen Gems",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 559,
      name: "TriStar Pictures",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 10156,
      name: "Affirm Films",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 769,
      name: "Destination Films",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 5340,
      name: "Left Bank Pictures",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 11341,
      name: "Stage 6 Films",
      sort: "primary_release_date.desc|popularity.desc"
    }
  ],
  "Paramount": [
    {
      id: 6808,
      name: "Viacom 18 Motion Pictures",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 4,
      name: "Paramount",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 838,
      name: "Paramount Vantage",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 24955,
      name: "Paramount Animation",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 90738,
      name: "Paramount Pictures (Canada)",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 112387,
      name: "Paramount Pictures",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 33333,
      name: "Paramount Famous Lasky Corporation",
      sort: "popularity.desc"
    },
    {
      id: 96540,
      name: "Paramount Players",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 7377,
      name: "Insurge Pictures",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 7407,
      name: "Insurgent Docs",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 746,
      name: "MTV Films",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 8136,
      name: "MTV",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 6043,
      name: "MTV Networks",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 2348,
      name: "Nickelodeon Movies",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 4859,
      name: "Nickelodeon Animation Studio",
      sort: "primary_release_date.desc|popularity.desc"
    }
  ],
  "Lionsgate": [
    {
      id: 35,
      name: "Lions Gate Films",
      sort: "popularity.desc"
    },
    {
      id: 1632,
      name: "Lionsgate",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 85885,
      name: "Lionsgate Premiere",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 17393,
      name: "Good Universe",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 58399,
      name: "Pantelion Films",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 8573,
      name: "Pantelion Film",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 114531,
      name: "Summit Premiere",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 491,
      name: "Summit Entertainment",
      sort: "primary_release_date.desc|popularity.desc"
    }
  ],
  "STX": [
    {
      id: 47729,
      name: "STX Entertainment",
      sort: "primary_release_date.desc|popularity.desc"
    }
  ],
  "Gaumont": [
    {
      id: 9,
      name: "Gaumont",
      sort: "primary_release_date.desc|popularity.desc"
    },
    {
      id: 7961,
      name: "Gaumont International",
      sort: "popularity.desc"
    },
    {
      id: 4978,
      name: "Gaumont British Picture Corporation",
      sort: "popularity.desc"
    },
    {
      id: 13800,
      name: "Gaumont Distribution",
      sort: "primary_release_date.desc|popularity.desc"
    }
  ],
  "MGM": [
    {
      id: 21,
      name: "Metro-Goldwyn-Mayer",
      sort: "primary_release_date.desc|popularity.desc"
    }
  ]
}
