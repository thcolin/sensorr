require('./utils/polyfill')

const parser = require('body-parser')
const express = require('express')
const cors = require('cors')
const compression = require('compression')
const bauth = require('express-basic-auth')
const busboy = require('connect-busboy')
const app = require('@server/store/app')
const server = require('@server/store/server')
const Config = require('@server/store/config')
const { paths } = require('@shared/utils/constants')

app.use('/db', require('@server/db'))

// Setup express app after require('db') to override PouchDB defaults
app.use(express.json())
app.use(parser.json({ limit: '10mb' }))
app.use(parser.urlencoded({ limit: '10mb', extended: true }))
app.use(busboy())

app.use(cors())
app.use(compression())
app.use(bauth({
  realm: '🍿📼 Sensorr - Your Friendly Digital Video Recorder',
  challenge: true,
  authorizer: (username, password) => (
    (!Config.payload.username & !Config.payload.password) ||
    (bauth.safeCompare(username, Config.payload.username) & bauth.safeCompare(password, Config.payload.password))
  ),
}))

app.get('/proxy', require('@server/controllers/proxy'))
app.use('/api', require('@server/api'))

if (app.get('env') === 'production') {
  app.get('/', require('@server/controllers/production'))
  app.use(express.static(paths.dist))
  app.use(require('@server/controllers/production')) // * route
}

require('@server/io')

server.listen(5070, () => process.send && process.send('ready'))
