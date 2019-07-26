const Sessions = require('@server/store/sessions')
const Jobs = require('@server/store/jobs')
const Plex = require('@server/store/plex')
const socket = require('@server/store/socket')
const loggers = require('@server/utils/loggers')
const log = loggers.socket

// Broadcast
Sessions.on('change', () => {
  log({ sessions: Object.keys(Sessions.entities).length })
  socket.emit('sessions', { sessions: Sessions.entities })
})

Jobs.on('change', () => {
  log({ jobs: Jobs.status() })
  socket.emit('jobs', { jobs: Jobs.status() })
})

Plex.on('status', (err) => {
  if (err) {
    log({ plex: Plex.status, err }, { color: Plex.status === 'off' ? 'red' : Plex.status === 'authorized' ? 'green' : 'yellow' })
    socket.emit('plex', { status: Plex.status, err })
  } else {
    log({ plex: Plex.status }, { color: Plex.status === 'off' ? 'red' : Plex.status === 'authorized' ? 'green' : 'yellow' })
    socket.emit('plex', { status: Plex.status })
  }
})

// Unicast (client)
socket.on('connection', client => {
  log({ event: 'connected' }, { client })

  client.sensorr = {
    streams: {}
  }

  // Bootstrap
  client.emit('sessions', { sessions: Sessions.entities })
  log({ sessions: Object.keys(Sessions.entities).length }, { client })
  client.emit('jobs', { jobs: Jobs.status() })
  log({ jobs: Jobs.status() }, { client })
  client.emit('plex', { status: Plex.status })
  log({ plex: Plex.status }, { client, color: Plex.status === 'off' ? 'red' : Plex.status === 'authorized' ? 'green' : 'yellow' })

  // Client "request"
  client.on('session', ({ session }) => {
    if (!client.sensorr.streams[session]) {
      client.sensorr.streams[session] = Sessions.stream(session)
      client.sensorr.streams[session].on('line', (line) => {
        const { data: { context, ...data }, ...entry } = JSON.parse(line)

        client.emit('session', {
          ...context,
          data,
          uuid: entry.uuid,
          time: entry.ts,
          message: entry.msg,
        })
      })

      setTimeout(() => client.emit('session', { session }), 5000)
      log({ event: 'streaming', session }, { client })
    } else {
      log({ event: 'already-streaming', session }, { client, color: 'yellow' })
    }
  })

  // Client "events"
  client.on('error', (err) => {
    Object.values(client.sensorr.streams).forEach((stream, index, src) => {
      stream.removeAllListeners('line')
      stream.unwatch()
      delete src[index]
    })

    log({ event: 'error', err }, { client, err: true })
  })

  client.on('disconnect', (reason) => {
    Object.values(client.sensorr.streams).forEach((stream, index, src) => {
      stream.removeAllListeners('line')
      stream.unwatch()
      delete src[index]
    })

    log({ event: 'disconnected', reason }, { client, err: true })
  })
})
