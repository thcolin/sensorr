const fs = require('fs')
const path = require('path')
const { of, throwError, bindNodeCallback } = require('rxjs')
const { mergeMap, mapTo } = require('rxjs/operators')
const constants = require('@shared/utils/constants')
const paths = {
  ...constants.paths,
  file: path.join(constants.paths.config, 'config.json'),
  fallback: path.join(constants.paths.root, 'config.default.json'),
}

class Config {
  constructor() {
    try {
      fs.accessSync(paths.file, fs.constants.R_OK)
    } catch(e) {
      fs.writeFileSync(paths.file, JSON.stringify(paths.fallback, null, 2))
    }

    this.payload = require(paths.file)
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
        disabled: !!xznab.disabled,
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
      adult: !!payload.adult,
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
      logs: {
        limit: parseInt(payload.logs.limit || 10),
      }
    }

    if (!this.payload.plex.pin.code) {
      const Plex = require('@server/store/plex')
      Plex.state('off')
    }

    return of(null).pipe(
      mergeMap(() => bindNodeCallback(fs.access)(this.payload.blackhole, fs.constants.W_OK)),
      mergeMap(err => err ? throwError(`Blackhole not writable : ${err}`) : of(paths.file)),
      mergeMap(() => bindNodeCallback(fs.access)(paths.file, fs.constants.W_OK)),
      mergeMap(err => err ? throwError(`Config file not writable : ${err}`) : of(paths.file)),
      mergeMap(() => bindNodeCallback(fs.writeFile)(paths.file, JSON.stringify(this.payload, null, 2))),
      mergeMap(err => err ? throwError(`Unable to write config : ${err}`) : of(paths.file)),
      mapTo(paths.file),
    )
  }
}

module.exports = new Config()
