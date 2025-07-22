const fs = require('fs')
const fetch = require('node-fetch')
const path = require('path')
const { of, throwError, bindNodeCallback } = require('rxjs')
const { map, mergeMap } = require('rxjs/operators')
const Config = require('@server/store/config')
const loggers = require('@server/utils/loggers')
const log = loggers.default

function grab(req, res) {
  const release = req.body.release || {}

  of(null).pipe(
    mergeMap(() => of(Config.payload.blackhole).pipe(
      mergeMap(blackhole => bindNodeCallback(fs.access)(blackhole, fs.constants.W_OK).pipe(
        map(err => !err),
        mergeMap(exist => exist ? of(null) : bindNodeCallback(fs.mkdir)(blackhole, { recursive: true })),
        mergeMap(err => err ? throwError(err) : of(null)),
      )),
    )),
    mergeMap(() => of(encodeURI(release.link)).pipe(
      mergeMap(link => fetch(link)),
      mergeMap(res => res.buffer()),
      mergeMap(buffer => {
        const filePath = path.join(Config.payload.blackhole, `${release.meta.generated}-${release.site}.torrent`)
        const resolvedPath = path.resolve(filePath)
        const basePath = path.resolve(Config.payload.blackhole)
        if (!resolvedPath.startsWith(basePath)) {
          return throwError(new Error('Invalid file path'))
        }
        return bindNodeCallback(fs.writeFile)(resolvedPath, buffer).pipe(
          mergeMap(err => err ? throwError(err) : of(resolvedPath)),
        )
      }),
    ))
  ).subscribe(
    (filename) => {
      log('grab', { title: release.title, link: release.link, filename })
      res.status(200).send({ release, filename })
    },
    (reason) => {
      log('grab', { err: reason, title: release.title, link: release.link }, { err: true })
      res.status(520).send({ release, reason: reason.toString(), })
    },
  )
}

module.exports = grab
