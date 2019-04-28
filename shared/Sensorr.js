const { from, of, throwError } = require('rxjs')
const { tap, map, toArray, concatAll, filter, mergeMap, pluck, timeout, retry, catchError } = require('rxjs/operators')
const oleoo = require('oleoo')
const string = require('./utils/string')
const XZNAB = require('./services/XZNAB')
const fallback = require('../config.default.json')

class Sensorr {
  constructor(config, options = {}) {
    this.MINIMUM_SIMILARITY = 0.6

    this.options = options

    this.config = {
      tmdb: '',
      blackhole: '/tmp',
      xznabs: [],
      filter: '',
      sort: 'seeders',
      descending: false,
      ...fallback,
      ...config,
    }

    this.xznabs = (this.config.xznabs || []).filter(xznab => !xznab.disabled).map(xznab => new XZNAB(xznab, options))
  }

  score(release) {
    return Object.keys(this.config.policy.prefer || {})
      .map(tag => this.config.policy.prefer[tag]
        .map((keyword, index, arr) =>
          (Array.isArray(release.meta[tag]) ? release.meta[tag] : [release.meta[tag]]).includes(keyword) ?
          (tag === 'flags' ? 1 : (arr.length - index) / arr.length) : 0
        )
        .reduce((score, value) => score += parseInt(value * 100), 0)
      )
      .reduce((score, value) => score += value, 0)
  }

  filter(release) {
    return Object.keys(this.config.policy.avoid || {})
      .map(tag => {
        const intersection = this.config.policy.avoid[tag].filter(
          keyword => (Array.isArray(release.meta[tag]) ? release.meta[tag] : [release.meta[tag]]).includes(keyword)
        )

        if (intersection.length) {
          throw new Error(`Release doesn't pass configured policy (${tag}=${intersection.join(', ')})`)
        }

        return true
      })
      .every(bool => bool)
  }

  sort(key, descending) {
    return (a, b) => {
      if (a.score === b.score) {
        if (descending) {
          if (a[key] < b[key]) return 1
          if (a[key] > b[key]) return -1
        } else {
          if (a[key] < b[key]) return -1
          if (a[key] > b[key]) return 1
        }

        return 0
      }

      return a.score < b.score ? 1 : -1
    }
  }

  look(movie, strict = false, hooks = {}) {
    return from(this.xznabs).pipe(
      mergeMap(xznab => from(movie.terms.titles).pipe(
        mergeMap(title => of(title).pipe(
          tap(title => typeof hooks.search === 'function' && hooks.search(xznab, title)),
          mergeMap(title => xznab.search(title)),
          timeout(10000),
          catchError(e => {
            if (e.name === 'TimeoutError' && typeof hooks.timeout === 'function') {
              hooks.timeout(xznab, title)
            }

            return throwError(e)
          }),
          retry(1),
          catchError(() => of({ items: [] })),
          pluck('items'),
          tap(items => typeof hooks.found === 'function' && hooks.found(xznab, title, items)),
          concatAll(),
          map(release => ({
            ...release,
            meta: oleoo.parse(release.title, {
              strict: false,
              flagged: true,
              defaults: {
                language: 'ENGLISH',
                resolution: 'SD',
                year: 0,
              },
            }),
          })),
          map(release => ({
            ...release,
            score: this.score(release),
          })),
          map(release => {
            const similarity = string.similarity(title, string.clean(release.meta.title)).toFixed(2)

            return ({
              ...release,
              similarity,
              valid: (similarity >= this.MINIMUM_SIMILARITY),
              reason: `Similarity too low : ${similarity} (📩 ${string.clean(release.meta.title)} / 🎯 ${title})`,
              warning: 2,
            })
          }),
          map(release => !release.valid ? release : ({
            ...release,
            valid: release.seeders,
            reason: `No seeders (0)`,
            warning: 2,
          })),
          map(release => !release.valid ? release : ({
            ...release,
            valid: movie.terms.years.some(year => new Date(release.publishDate).getFullYear() >= year),
            reason: `Release published year (${new Date(release.publishDate).getFullYear()}) prior to movie release years (${movie.terms.years.join(', ')})`,
            warning: 2,
          })),
          map(release => !release.valid ? release : ({
            ...release,
            valid: (parseInt(release.meta.year) === 0 || movie.terms.years.some(year => parseInt(release.meta.year) === year)),
            reason: `Release year (${release.meta.year}) ${
              parseInt(release.meta.year) === 0 ? 'unknown' : `different from movie release years (${movie.terms.years.join(', ')})`
            }`,
            warning: 2,
          })),
          map(release => {
            if (!release.valid) {
              return release
            } else {
              try {
                return ({
                  ...release,
                  valid: this.filter(release),
                  reason: null,
                  warning: 0,
                })
              } catch (e) {
                return ({
                  ...release,
                  valid: false,
                  reason: e.message,
                  warning: 1,
                })
              }
            }
          }),
          map(release => ({
            ...release,
            reason: release.valid ? null : release.reason,
            warning: release.valid ? 0 : release.warning,
          })),
          tap(release => typeof hooks.release === 'function' && hooks.release(xznab, title, release)),
          filter(release => !strict || release.valid),
        ), null, 1),
      ), null, 1),
      toArray(),
      map(releases => Object
        .values(releases.reduce((resullts, release) => ({ ...resullts, [release.guid]: [...(resullts[release.guid] || []), release] }), {}))
        .map(results => results.sort((a, b) => a.valid ? a : b).shift())
      ),
      map(releases => releases.sort(this.sort(this.config.sort, this.config.descending))),
    )
  }
}

module.exports = Sensorr
