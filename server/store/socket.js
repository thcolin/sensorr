const io = require('socket.io')
const server = require('@server/store/server')

const socket = io(server)

module.exports = socket
