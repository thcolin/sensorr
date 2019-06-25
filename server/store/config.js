const fs = require('fs')
const path = require('path')
const { of, throwError, bindNodeCallback } = require('rxjs')
const { mergeMap, mapTo } = require('rxjs/operators')

class Config {
  constructor() {
    this.filepath = path.join(__dirname, '..', '..', 'config', 'config.json')
    this.fallback = require(path.join(__dirname, '..', '..', 'config.default.json'))

    try {
      fs.accessSync(this.filepath, fs.constants.R_OK)
    } catch(e) {
      fs.writeFileSync(this.filepath, JSON.stringify(this.fallback, null, 2))
    }

    this.payload = require(this.filepath)
  }

  replace(partial) {
    const payload = { ...this.payload, ...partial }

    this.payload = {
      tmdb: (payload.tmdb || '').toString(),
      blackhole: (payload.blackhole || '').toString(),
      xznabs: (Array.isArray(payload.xznabs) ? payload.xznabs : []).map(xznab => ({
        name: (xznab.name || '').toString(),
        url: (xznab.url || '').toString(),
        key: (xznab.key || '').toString(),
      })),
      filter: (payload.filter || '').toString(),
      policy: {
        prefer: (obj => Object.keys(obj).reduce((acc, key) => ({
          ...acc,
          [key]: Array.isArray(obj[key]) ? obj[key].map(value => value.toString()) : [],
        }), {}))((payload.policy || {}).prefer || {}),
        avoid: (obj => Object.keys(obj).reduce((acc, key) => ({
          ...acc,
          [key]: Array.isArray(obj[key]) ? obj[key].map(value => value.toString()) : [],
        }), {}))((payload.policy || {}).avoid || {}),
      },
      sort: (['seeders', 'peers', 'size'].includes(payload.sort) ? payload.sort : 'seeders').toString(),
      descending: !!payload.descending,
      region: (payload.region || 'en-US').toString(),
      auth: {
        username: ((payload.auth || {}).username || '').toString(),
        password: ((payload.auth || {}).password || '').toString()
      },
      plex: {
        url: '',
        pin: {},
        token: '',
        ...this.payload.plex,
        ...((payload.plex || {}).url === (this.payload.plex || {}).url ? payload.plex : {
          url: (payload.plex.url || '').toString(),
          pin: {},
          token: '',
        })
      },
    }

    if (!this.payload.plex.pin.code) {
      const Plex = require('@server/store/plex')
      Plex.state('off')
    }

    return of(null).pipe(
      mergeMap(() => bindNodeCallback(fs.access)(this.payload.blackhole, fs.constants.W_OK)),
      mergeMap(err => err ? throwError(`Blackhole not writable : ${err}`) : of(this.filepath)),
      mergeMap(() => bindNodeCallback(fs.access)(this.filepath, fs.constants.W_OK)),
      mergeMap(err => err ? throwError(`Config file not writable : ${err}`) : of(this.filepath)),
      mergeMap(() => bindNodeCallback(fs.writeFile)(this.filepath, JSON.stringify(this.payload, null, 2))),
      mergeMap(err => err ? throwError(`Unable to write config : ${err}`) : of(this.filepath)),
      mapTo(this.filepath),
    )
  }
}

module.exports = new Config()
