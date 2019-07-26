import io from 'socket.io-client'

export function socketize(namespace = '', options = {}) {
  const socket = io(
    `${location.protocol}//${location.hostname}:${global.config.env === 'production' ? location.port : '5070'}${namespace ? `/${namespace}` : ''}`,
    {
      ...options,
      transports: ['websocket'],
    },
  )

  socket.on('reconnect_attempt', () => socket.io.opts.transports = ['polling', 'websocket'])
  socket.emit('ready')

  return socket
}

const socket = socketize()

export default socket
