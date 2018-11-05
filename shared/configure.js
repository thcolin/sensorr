const XZNAB = require('./services/XZNAB')
const fallback = require('../config.default.json')

module.exports = function configure(override = {}) {
  const config = {
    db: 'http://localhost:5984',
    blackhole: '/tmp',
    xznabs: [],
    filter: '',
    sort: 'seeders',
    descending: false,
    ...fallback,
    ...override,
  }

  return {
    ...config,
    xznabs: (config.xznabs || []).map(xznab => new XZNAB(xznab)),
    filtering: (release) => {
      return config.filter.split(', ').length === config.filter.split(', ')
        .map(input => {
          const payload = {
            query: input,
            key: 'original',
            negate: false,
          }

          if (payload.query.charAt(0) === '!') {
            payload.negate = true
            payload.query = payload.query.slice(1)
          }

          if (payload.query.match(/=/)) {
            payload.key = payload.query.split('=')[0]
            payload.query = payload.query.split('=')[1]
          }

          return payload
        })
        .map(({ negate, query, key }) => {
          const result = new RegExp(`(${query})`, 'i').test((release.meta[key] || '').toString())
          return negate ? !result : result
        })
        .reduce((total, current) => total += current, 0)
    },
    sorting: (a, b) => {
      if (config.descending) {
        if (a[config.sort] < b[config.sort]) return 1
        if (a[config.sort] > b[config.sort]) return -1
      } else {
        if (a[config.sort] < b[config.sort]) return -1
        if (a[config.sort] > b[config.sort]) return 1
      }

      return 0
    }
  }
}
