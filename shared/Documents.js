const { GENRES } = require('./services/TMDB')
const { clean, humanize } = require('./utils/string')

class Movie {
  constructor(payload, region = 'en-US') {
    this.payload = payload
    this.countries = ['US', 'UK', region.split('-').pop()]
  }

  judge() {
    const { vote_average = 0 } = this.payload

    if (!vote_average) {
      return '🤷'
    } else if (vote_average < 5) {
      return '👎'
    } else if (vote_average < 7) {
      return '👍'
    } else if (vote_average < 7.5) {
      return '👏'
    } else if (vote_average < 8) {
      return '🙌'
    } else {
      return '🙏'
    }
  }

  duration() {
    return humanize.time(this.payload.runtime || 0)
  }

  normalize() {
    return {
      id: this.payload.id.toString(),
      imdb_id: this.payload.imdb_id || '',
      title: this.payload.title,
      original_title: this.payload.original_title,
      release_date: (this.payload.release_date ? new Date(this.payload.release_date) : new Date()).getTime(),
      genres: (this.payload.genres || []).map(genre => typeof genre === 'object' ? genre.id : genre),
      year: this.payload.year ? this.payload.year : (this.payload.release_date ? new Date(this.payload.release_date) : new Date()).getFullYear(),
      poster_path: this.payload.poster_path || '',
      state: this.payload.state || 'wished',
      time: this.payload.time || Date.now(),
      popularity: this.payload.popularity || 0,
      vote_average: this.payload.vote_average || 0,
      runtime: this.payload.runtime || 0,
      terms: {
        titles: [
          ...new Set([this.payload.title, this.payload.original_title].concat(this.payload.titles ?
            this.payload.titles :
            ((this.payload.alternative_titles || {}).titles || [])
              .filter(title => this.countries.includes(title.iso_3166_1))
              .map(title => title.title)
          ).map(title => clean(title)).filter(title => title)),
        ],
        years: [
          ...new Set(this.payload.years ?
            this.payload.years :
            ((this.payload.release_dates || {}).results || [])
              .filter(date => this.countries.includes(date.iso_3166_1))
              .reduce((years, payload) => [
                ...years,
                ...payload.release_dates.map(date => new Date(date.release_date).getFullYear())
              ], [
                (this.payload.release_date ? new Date(this.payload.release_date) : new Date()).getFullYear(),
              ])
          )
        ],
      }
    }
  }
}

Movie.Sortings = {
  time: {
    value: 'time',
    label: '📚️  Last Action',
    apply: (a, b, reverse) => (parseInt((reverse ? a : b).time) || 0) - (parseInt((reverse ? b : a).time) || 0)
  },
  release_date: {
    value: 'release_date',
    label: '📅  Release date',
    apply: (a, b, reverse) => new Date((reverse ? a : b).release_date || 0) - new Date((reverse ? b : a).release_date || 0),
    labelize: (entity) => new Date(entity.release_date || 0).toLocaleDateString(),
  },
  popularity: {
    value: 'popularity',
    label: '📣  Popularity',
    apply: (a, b, reverse) => (parseInt((reverse ? a : b).popularity) || 0) - (parseInt((reverse ? b : a).popularity) || 0),
    labelize: (entity) => entity.popularity,
  },
  vote_average: {
    value: 'vote_average',
    label: '⭐  Vote Average',
    apply: (a, b, reverse) => (parseFloat((reverse ? a : b).vote_average) || 0) - (parseFloat((reverse ? b : a).vote_average) || 0),
    labelize: (entity) => entity.vote_average,
  },
  runtime: {
    value: 'runtime',
    label: '🕙  Runtime',
    apply: (a, b, reverse) => (parseInt((reverse ? a : b).runtime) || 0) - (parseInt((reverse ? b : a).runtime) || 0),
    labelize: (entity) => entity.runtime && `${entity.runtime} mins`,
  },
}

Movie.Filters = {
  query: (entities) => ({
    label: 'Query',
    type: 'input',
    default: '',
    apply: (entity, value) => [entity.title, entity.original_title].some(string => new RegExp(clean(value), 'i').test(clean(string)))
  }),
  genre: (entities) => ({
    label: 'Genre',
    type: 'checkbox',
    options: Object.keys(GENRES).map(id => ({
      value: id,
      label: GENRES[id],
    })),
    default: [],
    orderize: true,
    apply: (entity, values) => !values.length || values.some(id => (entity.genres || entity.genre_ids || []).includes(parseInt(id))),
    histogram: (entities) => entities.reduce((histogram, entity) => ({
      ...histogram,
      ...(Object.values(entity.genres || entity.genre_ids || []).reduce((acc, genre) => ({ ...acc, [genre]: histogram[genre] + 1 }), {}))
    }), Object.keys(GENRES).reduce((acc, curr) => ({ ...acc, [curr]: 0 }), {})),
  }),
  state: (entities) => ({
    label: 'State',
    type: 'checkbox',
    options: [
      {
        value: 'missing',
        label: '💊  Missing',
      },
      {
        value: 'pinned',
        label: '📍  Pinned',
      },
      {
        value: 'wished',
        label: '🍿  Wished',
      },
      {
        value: 'archived',
        label: '📼  Archived',
      },
    ],
    default: [],
    orderize: true,
    apply: (entity, values) => !values.length || values.some(state => entity.state === state),
    histogram: (entities) => entities.reduce((histogram, entity) => ({
      ...histogram,
      [entity.state]: histogram[entity.state] + 1,
    }), { missing: 0, pinned: 0, wished: 0, archived: 0 }),
  }),
  year: (entities) => {
    const step = 1
    const min = 1900
    const max = step + Math.max(
      (new Date()).getFullYear() + 7,
      entities.reduce((year, entity) => entity.year > year ? entity.year : year, (new Date()).getFullYear()),
    )

    return {
      label: 'Year',
      type: 'range',
      default: [min, max],
      min: min,
      max: max,
      step: step,
      apply: (entity, values) => entity.year >= values[0] && entity.year < values[1],
      histogram: (entities) => entities.reduce((histogram, entity) => ({
        ...histogram,
        [parseInt(entity.year || 0)]: (histogram[parseInt(entity.year || 0)] || 0) + 1,
      }), Array(max - min).fill(true).reduce((acc, curr, index) => ({ ...acc, [min + index]: 0 }), {})),
    }
  },
  popularity: (entities) => {
    const highest = entities.reduce((popularity, entity) => entity.popularity > popularity ? entity.popularity : popularity, 0)
    const compute = (popularity = 0) => Math.max(0, parseInt((popularity / highest) * 100) - 1)
    const min = 0
    const max = 100

    return {
      label: 'Popularity',
      type: 'range',
      default: [min, max],
      min: min,
      max: max,
      apply: (entity, values) => compute(entity.popularity) >= values[0] && compute(entity.popularity) < values[1],
      histogram: (entities) => entities.reduce((histogram, entity) => ({
        ...histogram,
        [compute(entity.popularity)]: (histogram[compute(entity.popularity)] || 0) + 1,
      }), Array(max - min).fill(true).reduce((acc, curr, index) => ({ ...acc, [min + index]: 0 }), {})),
    }
  },
  vote_average: (entities) => {
    const min = 0
    const max = 10
    const compute = (vote_average = 0) => Math.min(max, Math.max(min, Math.floor(vote_average)))

    return {
      label: 'Vote Average',
      type: 'range',
      default: [min, max],
      min: min,
      max: max,
      apply: (entity, values) => entity.vote_average >= values[0] && entity.vote_average <= values[1],
      histogram: (entities) => entities.reduce((histogram, entity) => ({
        ...histogram,
        [compute(entity.vote_average)]: (histogram[compute(entity.vote_average)] || 0) + 1,
        ...(entity.vote_average % 1 ? {} : {
          [compute(entity.vote_average - 0.1)]: (histogram[compute(entity.vote_average - 0.1)] || 0) + 1,
        })
      }), Array(max - min).fill(true).reduce((acc, curr, index) => ({ ...acc, [index]: 0 }), {})),
    }
  },
  runtime: (entities) => {
    const compute = (runtime = 0) => Math.max(0, parseInt(runtime / 10) * 10)
    const step = 10
    const min = 0
    const max = step + compute(entities.reduce((runtime, entity) => entity.runtime > runtime ? entity.runtime : runtime, 0))

    return {
      label: 'Duration',
      type: 'range',
      default: [min, max],
      min: min,
      max: max,
      step: step,
      labelize: (value) => humanize.time(value).replace(/ /, ''),
      apply: (entity, values) => compute(entity.runtime) >= values[0] && compute(entity.runtime) < values[1],
      histogram: (entities) => entities.reduce((histogram, entity) => ({
        ...histogram,
        [compute(entity.runtime)]: (histogram[compute(entity.runtime)] || 0) + 1,
      }), Array(Math.floor((max - min) / 10)).fill(true).reduce((acc, curr, index) => ({ ...acc, [index * 10]: 0 }), {})),
    }
  },
}

class Star {
  constructor(payload) {
    this.payload = payload
  }

  normalize() {
    return {
      id: this.payload.id.toString(),
      imdb_id: this.payload.imdb_id,
      name: this.payload.name,
      gender: this.payload.gender || 0,
      also_known_as: this.payload.also_known_as || [],
      known_for_department: this.payload.known_for_department || '',
      birthday: this.payload.birthday || '',
      popularity: this.payload.popularity,
      profile_path: this.payload.profile_path || '',
      state: this.payload.state || 'stalked',
      time: this.payload.time || Date.now(),
      credits: Array.isArray(this.payload.credits) ? this.payload.credits : [
        ...(this.payload.credits || { cast: [] }).cast,
        ...(this.payload.credits || { crew: [] }).crew,
        ...(this.payload.movie_credits || { cast: [] }).cast,
        ...(this.payload.movie_credits || { crew: [] }).crew,
      ],
    }
  }
}

Star.Sortings = {
  time: {
    value: 'time',
    label: '📚️  Last Action',
    apply: (a, b, reverse) => (parseInt((reverse ? a : b).time) || 0) - (parseInt((reverse ? b : a).time) || 0)
  },
  popularity: {
    value: 'popularity',
    label: '📣  Popularity',
    apply: (a, b, reverse) => (parseInt((reverse ? a : b).popularity) || 0) - (parseInt((reverse ? b : a).popularity) || 0),
    labelize: (entity) => entity.popularity,
  },
  birth: {
    value: 'birth',
    label: '🎂  Birthday',
    apply: (a, b, reverse) => (new Date((reverse ? a : b).birthday) || 0) - (new Date((reverse ? b : a).birthday) || 0),
    labelize: (entity) => new Date(entity.birthday).toLocaleString(),
  },
}

Star.Filters = {
  query: (entities) => ({
    label: 'Query',
    type: 'input',
    default: '',
    apply: (entity, value) => [entity.name, ...entity.also_known_as].some(string => new RegExp(clean(value), 'i').test(clean(string)))
  }),
  known_for_department: (entities) => {
    const departments = entities.reduce((acc, entity) => ({ ...acc, [entity.known_for_department || '']: 0 }), {})

    return {
      label: 'Department',
      type: 'checkbox',
      options: Object.keys(departments).filter(f => f).map(department => ({
        label: department,
        value: department,
      })),
      default: [],
      orderize: true,
      apply: (entity, values) => !values.length || values.some(department => entity.known_for_department === department),
      histogram: (entities) => entities.reduce((histogram, entity) => ({
        ...histogram,
        [entity.known_for_department || '']: histogram[entity.known_for_department] + 1,
      }), departments),
    }
  },
  gender: (entities) => ({
    label: 'Gender',
    type: 'checkbox',
    options: [
      {
        value: 0,
        label: 'Not specified',
      },
      {
        value: 1,
        label: 'Female',
      },
      {
        value: 2,
        label: 'Male',
      },
    ],
    default: [],
    orderize: true,
    apply: (entity, values) => !values.length || values.some(gender => entity.gender === gender),
    histogram: (entities) => entities.reduce((histogram, entity) => ({
      ...histogram,
      [entity.gender || 0]: histogram[entity.gender || 0] + 1,
    }), { 0: 0, 1: 0, 2: 0 }),
  }),
  birth: (entities) => {
    const compute = (birthday) => new Date(birthday || 0).getFullYear()

    const max = 1 + Math.max((new Date()).getFullYear() - 10, entities.reduce((birthyear, entity) =>
      compute(entity.birthday) > birthyear ?
      compute(entity.birthday) : birthyear,
    1800))

    const min = Math.max(1800, entities.reduce((birthyear, entity) =>
      compute(entity.birthday) < birthyear ?
      compute(entity.birthday) : birthyear,
    max - 1))

    return {
      label: 'Birth',
      type: 'range',
      default: [min, max],
      min: min,
      max: max,
      apply: (entity, values) => compute(entity.birthday) >= values[0] && compute(entity.birthday) < values[1],
      histogram: (entities) => entities.reduce((histogram, entity) => ({
        ...histogram,
        [compute(entity.birthday)]: (histogram[compute(entity.birthday)] || 0) + 1,
      }), Array(Math.max(0, max - min)).fill(true).reduce((acc, curr, index) => ({ ...acc, [min + index]: 0 }), {})),
    }
  },
  popularity: (entities) => {
    const highest = entities.reduce((popularity, entity) => entity.popularity > popularity ? entity.popularity : popularity, 0)
    const compute = (popularity = 0) => Math.max(0, parseInt((popularity / highest) * 100) - 1)
    const min = 0
    const max = 100

    return {
      label: 'Popularity',
      type: 'range',
      default: [min, max],
      min: min,
      max: max,
      apply: (entity, values) => compute(entity.popularity) >= values[0] && compute(entity.popularity) < values[1],
      histogram: (entities) => entities.reduce((histogram, entity) => ({
        ...histogram,
        [compute(entity.popularity)]: (histogram[compute(entity.popularity)] || 0) + 1,
      }), Array(max - min).fill(true).reduce((acc, curr, index) => ({ ...acc, [min + index]: 0 }), {})),
    }
  },
}

module.exports = {
  Movie,
  Star,
}
