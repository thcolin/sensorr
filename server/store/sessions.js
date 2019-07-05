const fs = require('fs')
const path = require('path')
const Tail = require('tail').Tail
const Readable = require('stream').Readable
const EventEmitter = require('events')
const { paths } = require('@shared/utils/constants')

class Sessions extends EventEmitter {
  constructor() {
    super()

    this.entities = {}

    try {
      fs.accessSync(paths.sessions, fs.constants.W_OK)
    } catch (err) {
      fs.mkdirSync(paths.sessions, { recursive: true })
    }

    fs.readdir(paths.sessions, (err, files) => {
      files
        .map(file => ({
          file,
          job: file.split('-').pop().split('.').shift(),
          uuid: file.split('-').slice(0, -1).join('-'),
        }))
        .filter(session => session.job && session.uuid)
        .forEach(session => fs.stat(
          path.join(paths.sessions, session.file),
          (err, stats) => this.entities[session.uuid] = {
            ...session,
            time: stats.birthtime,
          },
        ))

      this.emit('change')
    })

    fs.watch(paths.sessions, (e, file) => {
      const session = {
        file,
        job: file.split('-').pop().split('.').shift(),
        uuid: file.split('-').slice(0, -1).join('-'),
        time: new Date(),
      }

      this.entities[session.uuid] = session
      this.emit('change')
    })
  }

  stream(uuid) {
    if (this.entities[uuid]) {
      return new Tail(
        path.join(paths.sessions, this.entities[uuid].file),
        {
          fromBeginning: true,
          useWatchFile: true,
        }
      )
    } else {
      const stream = new Readable()
      stream.destroy()
      return stream
    }
  }
}

module.exports = new Sessions()
