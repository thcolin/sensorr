const { from, of, throwError } = require('rxjs')
const { tap, map, delay, toArray, concatAll, filter, mergeMap, pluck, timeout, retry, catchError } = require('rxjs/operators')
const oleoo = require('oleoo')
const string = require('./utils/string')
const filesize = require('./utils/filesize')
const XZNAB = require('./services/XZNAB')
const fallback = require('../config.default.json')

class Sensorr {
  constructor(payload, options = {}) {
    this.MINIMUM_SIMILARITY = 0.6

    this.options = options

    const config = {
      tmdb: '',
      blackhole: '/tmp',
      xznabs: [],
      filter: '',
      sort: 'seeders',
      descending: false,
      ...fallback,
      ...payload,
    }

    this.config = {
      ...config,
      logs: {
        ...config.logs,
        limit: filesize.parse(`${config.logs.limit}MB`),
      }
    }

    this.xznabs = (this.config.xznabs || []).filter(xznab => !xznab.disabled).map(xznab => new XZNAB(xznab, options))
  }

  score(release, details = false) {
    const score = Object.keys(this.config.policy.prefer || {})
      .reduce((acc, tag) => ({
        ...acc,
        [tag]: this.config.policy.prefer[tag]
          .reduce((acc, keyword, index, arr) => {
            const base = (tag === 'flags' ? 1 : (arr.length - index) / arr.length)
            const test = (tag === 'custom' ?
              (keyword) => (new RegExp(keyword, 'ig').test(release.meta.original) || new RegExp(keyword, 'ig').test(release.meta.generated)) :
              (keyword) => (Array.isArray(release.meta[tag]) ? release.meta[tag] : [release.meta[tag]]).includes(keyword)
            )

            return {
              ...acc,
              [keyword]: test(keyword) ? parseInt(base * 100) : 0,
            }
          }, {})
      }), {})

    return details ?
      score :
      release.score + Object.keys(score).reduce((sum, key, index, arr) => sum += Object.values(score[key]).reduce((s, v) => s + v, 0), 0)
  }

  filter(release) {
    return Object.keys(this.config.policy.avoid || {})
      .map(tag => {
        const test = (tag === 'custom' ?
          (keyword) => (new RegExp(keyword, 'ig').test(release.meta.original) || new RegExp(keyword, 'ig').test(release.meta.generated)) :
          (keyword) => (Array.isArray(release.meta[tag]) ? release.meta[tag] : [release.meta[tag]]).includes(keyword)
        )

        const intersection = this.config.policy.avoid[tag].filter(test)

        if (intersection.length) {
          throw new Error(`👮 Release doesn't pass configured policy (${tag}=${intersection.join(', ')})`)
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
    return from(movie.terms.titles).pipe(
      mergeMap(title => from(this.xznabs).pipe(
        mergeMap(xznab => of(xznab).pipe(
          tap(xznab => typeof hooks.search === 'function' && hooks.search(xznab, title)),
          mergeMap(xznab => xznab.search(title).pipe(
            timeout(10000),
            catchError(e => {
              if (e.name === 'TimeoutError' && typeof hooks.timeout === 'function') {
                hooks.timeout(xznab, title)
              }

              return throwError(e)
            }),
          )),
          retry(1),
          catchError(() => of({ items: [] })),
          pluck('items'),
          tap(items => typeof hooks.found === 'function' && hooks.found(xznab, title, items)),
          concatAll(),
          map(release => ({
            ...release,
            term: title,
            similarity: 0,
            score: 0,
            valid: true,
            reason: null,
            warning: 0,
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
          map(release => {
            const valid = movie.terms.years.some(year => new Date(release.publishDate).getFullYear() >= year)

            return {
              ...release,
              valid,
              reason: valid ? null : `📰 Release published year (${new Date(release.publishDate).getFullYear()}) prior to movie release years (${movie.terms.years.join(', ')})`,
              warning: valid ? 0 : 2,
            }
          }),
          map(release => {
            if (!release.valid) {
              return release
            } else {
              const valid = (parseInt(release.meta.year) === 0 || movie.terms.years.some(year => parseInt(release.meta.year) === year))

              return {
                ...release,
                valid,
                reason: valid ? null : `🕰 Release year (${release.meta.year}) ${
                  parseInt(release.meta.year) === 0 ? 'unknown' : `different from movie release years (${movie.terms.years.join(', ')})`
                }`,
                warning: valid ? 0 : 2,
              }
            }
          }),
          map(release => {
            if (!release.valid) {
              return release
            } else {
              const similarity = movie.terms.titles
                .map(title => string.similarity(title, string.clean(release.meta.title)).toFixed(2))
                .sort((a, b) => b - a)
                .shift()

              const valid = similarity >= this.MINIMUM_SIMILARITY

              return ({
                ...release,
                similarity,
                score: valid ? release.score + 1000 : release.score,
                valid,
                reason: valid ? null : `🎯 Similarity too low : ${similarity} ("${string.clean(release.meta.title)}" doesn't match with "${movie.terms.titles.join(', ')}")`,
                warning: valid ? 0 : 2,
              })
            }
          }),
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
          map(release => {
            if (!release.valid) {
              return release
            } else {
              const valid = !!release.seeders

              return {
                ...release,
                valid,
                reason: valid ? null : `🌍 No seeders`,
                warning: valid ? 0 : 1,
              }
            }
          }),
          map(release => ({ ...release, score: this.score(release) })),
          tap(release => typeof hooks.release === 'function' && hooks.release(xznab, title, release)),
          filter(release => !strict || release.valid),
          delay(2000),
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
