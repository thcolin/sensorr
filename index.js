require('universal-url').shim()

const fs = require('fs')
const pm2 = require('pm2')
const chalk = require('chalk')
const http = require('http')
const parser = require('body-parser')
const express = require('express')
const io = require('socket.io')
const request = require('request')
const fetch = require('node-fetch')
const path = require('path')
const cors = require('cors')
const compression = require('compression')
const bauth = require('express-basic-auth')
const { of, throwError, bindNodeCallback } = require('rxjs')
const { map, mergeMap } = require('rxjs/operators')
const PouchDB = require('pouchdb')
const atob = require('atob')
const escape = require('escape-string-regexp')

let template = null

pm2.connect(function(err) {
  if (!err) {
    console.log(`${chalk.bgGreen(chalk.black(' PM2 '))} ${chalk.green('Connected successfully')}`)
  } else {
    console.log(`${chalk.bgRed(chalk.black(' PM2 '))} ${chalk.red(url)} ${chalk.gray(`Unable to connect : ${err}`)}`)
    exit(2)
  }
})

try {
  fs.accessSync(path.join(__dirname, 'dist', 'index.html'), fs.constants.R_OK)
  template = fs.readFileSync(path.join(__dirname, 'dist', 'index.html'), 'utf8')
} catch(e) {
  template = fs.readFileSync(path.join(__dirname, 'src', 'views', 'index.html'), 'utf8')
    .replace(/<script>var config = .*?<\/script>/, '<script>var config = "__WEBPACK_INJECT_CONFIG__"</script>')
}

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

app.use(parser.json({ limit: '5mb' }))
app.use(parser.urlencoded({ limit: '5mb', extended: true }))

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
    res.status(403).send({ message: 'Blacklisted URL' })
  }
})

const api = express()

api.get('/status', function (req, res) {
  pm2.list((err, jobs) => {
    if (!err) {
      res.status(200).send({
        status: jobs
          .filter(job => job.name !== 'sensorr:web')
          .reduce((status, job) => ({ ...status, [job.name.replace(/sensorr:/, '')]: job.pid !== 0 }), {}),
      })
    } else {
      res.status(200).send({
        status: {},
      })
    }
  })
})

api.post('/trigger', function (req, res) {
  const type = req.body.type

  pm2.list((err, jobs) => {
    if (!err) {
      const job = jobs.filter(job => job.name !== 'sensorr:web' && job.name === `sensorr:${type}`).pop()

      if (job && job.pid === 0) {
        pm2.restart(job.name, err => {
          if (!err) {
            console.log(`${chalk.bgGreen(chalk.black(' TRIGGER '))} ${chalk.green(job.name)}`)
            res.status(200).send({ message: `Trigger "${type}" job`, })
          } else {
            console.log(`${chalk.bgRed(chalk.black(' TRIGGER '))} ${chalk.red(job.name)} ${err}`)
            res.status(409).send({ message: `Error during "${type}" job pm2 restart`, err, })
          }
        })
      } else if (!job) {
        console.log(`${chalk.bgRed(chalk.black(' TRIGGER '))} ${chalk.red(`Unknown "${type}" job`)} ${chalk.gray(`sensorr:${type}`)}`)
        res.status(400).send({ message: `Unknown pm2 "${type}" job`, })
      } else {
        console.log(`${chalk.bgRed(chalk.black(' TRIGGER '))} ${chalk.red(`sensorr:${type}`)} ${err}`)
        res.status(409).send({ message: 'Job already triggered', err, })
      }
    } else {
      console.log(`${chalk.bgRed(chalk.black(' TRIGGER '))} ${chalk.red(`Error on pm2 process list`)}`)
      res.status(400).send({ message: `Error on pm2 process list`, })
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
    region: body.region,
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

const server = http.createServer(app)
const socket = io(server)
const jobs = ['record']
const events = { online: true, exit: false }
const status = {}

pm2.list((err, payload) => {
  if (!err) {
    payload
      .filter(job => jobs.includes(job.name.split(':').pop()))
      .forEach(job => status[job.name.split(':').pop()] = job.pm2_env.status === 'online')
  }
})

socket.on('connection', client => {
  console.log(`${chalk.bgGreen(chalk.black(' Socket '))} ${chalk.green(`Client #${client.id} connected`)}`)

  client.emit('status', { status })
  console.log(`${chalk.bgGreen(chalk.black(' Socket '))} ${chalk.green(`Client #${client.id}`)} ${chalk.gray(JSON.stringify({ status }))}`)

  client.on('disconnect', (reason) => console.log(
    `${chalk.bgRed(chalk.black(' Socket '))} ${chalk.red(`Client #${client.id} disconnected`)} ${chalk.gray(JSON.stringify(reason))}`
  ))

  client.on('error', (data) => console.log(
    `${chalk.bgRed(chalk.black(' Socket '))} ${chalk.red(`Client #${client.id} error`)} ${chalk.gray(JSON.stringify(data))}`
  ))
})

pm2.launchBus((err, bus) => {
  bus.on('process:*', (e, data) => {
    const job = data.process.name.split(':').pop()

    if (jobs.includes(job) && Object.keys(events).includes(data.event)) {
      status[job] = events[data.event]
      socket.emit('status', { status })
      console.log(`${chalk.bgGreen(chalk.black(' Socket '))} ${chalk.green(`Broadcast`)} ${chalk.gray(JSON.stringify({ status }))}`)
    }
  })
})

server.listen(5070, () => process.send('ready'))
