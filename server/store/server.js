const http = require('http')
const app = require('@server/store/app')

const server = http.createServer(app)

module.exports = server
