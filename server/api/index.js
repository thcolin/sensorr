const express = require('express')

const api = express()

api.post('/trigger', require('@server/api/trigger'))
api.post('/configure', require('@server/api/configure'))
api.post('/plex', require('@server/api/plex'))
api.post('/grab', require('@server/api/grab'))
api.get('/dump', require('@server/api/dump'))
api.post('/load', require('@server/api/load'))

module.exports = api
