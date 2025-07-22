const https = require('https') // Changed from 'http' to 'https'
const app = require('@server/store/app')

const server = https.createServer(app) // Changed from 'http.createServer' to 'https.createServer'

module.exports = server
