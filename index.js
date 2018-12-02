const fs = require('fs')
const chalk = require('chalk')
const express = require('express')
const request = require('request')
const fetch = require('node-fetch')
const path = require('path')
const cors = require('cors')
const compression = require('compression')
const bauth = require('express-basic-auth')
const tail = require('fs-reverse')
const { of, throwError, bindNodeCallback } = require('rxjs')
const { map, mergeMap } = require('rxjs/operators')
const PouchDB = require('pouchdb')
const atob = require('atob')
const escape = require('escape-string-regexp')

const template = fs.readFileSync(path.join(__dirname, 'dist', 'index.html'), 'utf8')

try {
  fs.accessSync(path.join(__dirname, 'config', 'config.json'), fs.constants.R_OK)
} catch(e) {
  const fallback = require(path.join(__dirname, 'config.default.json'))
  fs.writeFileSync(path.join(__dirname, 'config', 'config.json'), JSON.stringify(fallback, null, 2))
}

let config = require(path.join(__dirname, 'config', 'config.json'))

const authorizer = (username, password) => (
  (!config.username && !config.password) ||
  (username === config.username && password === config.password)
)

const app = express()

app.use(cors())
app.use(compression())
app.use(express.json())
app.use(bauth({
  authorizer,
  challenge: true,
  realm: 'Sensorr - Movie release radar',
}))

app.get('/proxy', function (req, res) {
  const url = atob(req.query.url)

  if (config.xznabs.some(xznab => url.match(new RegExp(`^${escape(new URL(xznab.url).origin)}`)))) {
    console.log(`${chalk.bgGreen(chalk.black(' PROXY '))} ${chalk.green(url)}`)
    req.pipe(request(url)).pipe(res)
  } else{
    console.log(`${chalk.bgRed(chalk.black(' PROXY '))} ${chalk.red(url)} ${chalk.gray(JSON.stringify(req.query))}`)
    res.status(403).send('Blacklisted URL')
  }
})

const api = express()

api.get('/history', function (req, res) {
  const file = path.join(__dirname, 'history.log')
  const start = Math.max(parseInt(req.query.start) || 0, 0)
  const end = Math.max(10, parseInt(req.query.end) || 0)

  fs.access(file, fs.constants.R_OK, (err) => {
    if (err) {
      res.status(200).send({ history: [] })
    } else {
      const stream = tail(file)
      const history = []

      stream.on('close', () => res.status(200).send({ history: history.slice(start) }))
      stream.on('data', (line) => {
        if (line) {
          history.push(JSON.parse(line))

          if (history.length === end) {
            stream.destroy()
          }
        }
      })
    }
  })
})

api.post('/configure', function (req, res) {
  const file = path.join(__dirname, 'config', 'config.json')
  const body = req.body.config || {}
  const payload = {
    tmdb: body.tmdb,
    blackhole: body.blackhole,
    xznabs: Array.isArray(body.xznabs) ? body.xznabs : [],
    filter: (body.filter || '').toString(),
    sort: ['seeders', 'peers', 'size'].includes(body.sort) ? body.sort : 'seeders',
    descending: !!body.descending,
    auth: {
      username: (body.auth.username || '').toString(),
      password: (body.auth.password || '').toString()
    }
  }

  of(null).pipe(
    mergeMap(() => bindNodeCallback(fs.access)(payload.blackhole, fs.constants.W_OK)),
    mergeMap(err => err ? throwError(err) : of(file)),
    mergeMap(() => bindNodeCallback(fs.access)(file, fs.constants.W_OK)),
    mergeMap(err => err ? throwError(err) : of(file)),
    mergeMap(() => bindNodeCallback(fs.writeFile)(file, JSON.stringify(payload, null, 2))),
    mergeMap(err => err ? throwError(err) : of(file)),
  ).subscribe(
    () => {
      console.log(`${chalk.bgGreen(chalk.black(' CONFIGURE '))} ${chalk.green(file)}`)
      config = payload
      res.status(200).send({ file })
    },
    (reason) => {
      console.log(`${chalk.bgRed(chalk.black(' CONFIGURE '))} ${chalk.red(reason)}`)
      console.log(chalk.gray(JSON.stringify(payload, null, 2)))
      res.status(520).send({ file, reason: reason.toString(), })
    },
  )
})

api.post('/grab', function (req, res) {
  const release = req.body.release || {}

  of(null).pipe(
    mergeMap(() => of(config.blackhole).pipe(
      mergeMap(blackhole => bindNodeCallback(fs.access)(blackhole, fs.constants.W_OK).pipe(
        map(err => !err),
        mergeMap(exist => exist ? of(null) : bindNodeCallback(fs.mkdir)(blackhole, { recursive: true })),
        mergeMap(err => err ? throwError(err) : of(null)),
      )),
    )),
    mergeMap(() => of(encodeURI(release.link)).pipe(
      mergeMap(link => fetch(link)),
      mergeMap(res => res.buffer()),
      mergeMap(buffer => bindNodeCallback(fs.writeFile)(path.join(config.blackhole, `${release.meta.generated}-${release.site}.torrent`), buffer).pipe(
        mergeMap(err => err ? throwError(err) : of(path.join(config.blackhole, `${release.meta.generated}-${release.site}.torrent`))),
      )),
    ))
  ).subscribe(
    (filename) => {
      console.log(`${chalk.bgGreen(chalk.black(' GRAB '))} ${chalk.green(release.title)}`)
      console.log(chalk.gray(release.link))
      console.log(chalk.gray(filename))
      res.status(200).send({ release, filename })
    },
    (reason) => {
      console.log(`${chalk.bgRed(chalk.black(' GRAB '))} ${chalk.red(release.title)} ${chalk.red(reason)}`)
      console.log(chalk.gray(JSON.stringify(release, null, 2)))
      res.status(520).send({ release, reason: reason.toString(), })
    },
  )
})

app.use('/api', api)

const db = require('express-pouchdb')(PouchDB.defaults({ prefix: `db/` }), {
  configPath: path.join(__dirname, 'pouchdb.json'),
  mode: 'fullCouchDB',
  overrideMode: {
    exclude: [
      'routes/authentication',
      'routes/authorization',
      'routes/session',
    ],
  },
})

app.use('/db', db)

if (app.get('env') === 'production') {
  const index = function (req, res) {
    fs.readFile(path.join(__dirname, 'config', 'config.json'), 'utf8', (err, data) => {
      if (!err) {
        try {
          config = JSON.parse(data)
        } catch(e) {}
      }

      console.log(`${chalk.bgGreen(chalk.black(' SERVE '))} ${chalk.green('index.html')}`)
      res.send(template.replace(/"__WEBPACK_INJECT_CONFIG__"/, JSON.stringify(config)))
    })
  }

  app.get('/', index)
  app.use(express.static(path.join(__dirname, 'dist')))
  app.use(index)
}

app.listen(app.get('env') === 'production' ? 5070 : 7000)
