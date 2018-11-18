const { from, of } = require('rxjs')
const { tap, map, toArray, concatAll, filter, mergeMap, pluck, timeout, retry, catchError } = require('rxjs/operators')
const oleoo = require('oleoo')
const similarity = require('string-similarity')
const XZNAB = require('./services/XZNAB')
const fallback = require('../config.default.json')

class Sensorr {
  constructor(config) {
    this.SIMILARITY_MINIMUM_SCORE = 0.6

    this.config = {
      blackhole: '/tmp',
      xznabs: [],
      filter: '',
      sort: 'seeders',
      descending: false,
      ...fallback,
      ...config,
    }

    this.xznabs = (this.config.xznabs || []).map(xznab => new XZNAB(xznab))
  }

  filter(query) {
    return (release) => {
      return query.split(', ').length === query.split(', ')
        .map(input => {
          const payload = {
            pattern: input,
            key: 'original',
            negate: false,
          }

          if (payload.pattern.charAt(0) === '!') {
            payload.negate = true
            payload.pattern = payload.pattern.slice(1)
          }

          if (payload.pattern.match(/=/)) {
            payload.key = payload.pattern.split('=')[0]
            payload.pattern = payload.pattern.split('=')[1]
          }

          return payload
        })
        .map(({ negate, pattern, key }) => {
          const result = new RegExp(`(${pattern})`, 'i').test((release.meta[key] || '').toString())
          return negate ? !result : result
        })
        .reduce((total, current) => total += current, 0)
    }
  }

  sort(key, descending) {
    return (a, b) => {
      if (descending) {
        if (a[key] < b[key]) return 1
        if (a[key] > b[key]) return -1
      } else {
        if (a[key] < b[key]) return -1
        if (a[key] > b[key]) return 1
      }

      return 0
    }
  }

  look(movie, strict = false, hooks = {}) {
    return from(this.xznabs).pipe(
      mergeMap(xznab => from(
        movie.original_title && movie.original_title !== movie.title ? [movie.title, movie.original_title] : [movie.title]
      ).pipe(
        map(title => title.normalize('NFD').replace(/[\u0300-\u036f]/g, '')),
        mergeMap(title => of(title).pipe(
          tap(title => typeof hooks.search === 'function' && hooks.search(xznab, title)),
          mergeMap(title => xznab.search(title)),
          timeout(15000),
          retry(2),
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
            score: similarity.compareTwoStrings(title, release.meta.title).toFixed(2),
            valid: true,
            warning: 0,
          })),
          map(release => !release.valid ? release : ({
            ...release,
            valid: release.seeders,
            reason: `No seeders (0)`,
            warning: 2,
          })),
          map(release => !release.valid ? release : ({
            ...release,
            valid: (release.score >= this.SIMILARITY_MINIMUM_SCORE),
            reason: `Score too low : ${release.score}`,
            warning: 2,
          })),
          map(release => !release.valid ? release : ({
            ...release,
            valid: (new Date(release.publishDate).getFullYear() >= movie.year),
            reason: `Release published year (${new Date(release.publishDate).getFullYear()}) prior to movie release year (${movie.year})`,
            warning: 2,
          })),
          map(release => !release.valid ? release : ({
            ...release,
            valid: (parseInt(release.meta.year) === 0 || parseInt(release.meta.year) === movie.year),
            reason: `Release year (${release.meta.year}) ${
              parseInt(release.meta.year) === 0 ? 'unknown' : `different from movie year (${movie.year})`
            }`,
            warning: 2,
          })),
          map(release => !release.valid ? release : ({
            ...release,
            valid: this.filter(this.config.filter)(release),
            reason: `Release doesn't pass configured filtering (${this.config.filter})`,
            warning: 1,
          })),
          map(release => ({
            ...release,
            reason: release.valid ? null : release.reason,
            warning: release.valid ? 0 : release.warning,
          })),
          tap(release => typeof hooks.release === 'function' && hooks.release(xznab, title, release)),
          filter(release => !strict || release.valid),
        ), null, 1),
      )),
      toArray(),
      map(releases => Object
        .values(releases.reduce((results, release) => ({ ...results, [release.guid]: [...(results[release.guid] || []), release] }), {}))
        .map(results => results.sort((a, b) => b.score - a.score).shift())
      ),
    )
  }
}

module.exports = Sensorr
