import io from 'socket.io-client'

const socket = io(`${location.protocol}//${location.host}`, { transports: ['websocket'] })
socket.on('reconnect_attempt', () => socket.io.opts.transports = ['polling', 'websocket'])
socket.emit('ready')

export default socket
