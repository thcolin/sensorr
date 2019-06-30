const ecosystem = require('@root/ecosystem.config')
const EventEmitter = require('events')
const pm2 = require('@server/store/pm2')

class Jobs extends EventEmitter {
  constructor() {
    super()

    const status = {
      'online': true,
      'stopping': false,
      'stopped': false,
      'restart': false,
      'exit': false,
      'stop': false,
      'launching': true,
      'errored': false,
      'one-launch-status': true,
    }

    this.entities = ecosystem.apps
      .filter(job => !['sensorr:web'].includes(job.name))
      .reduce((entities, job) => ({
        ...entities,
        [job.name]: {
          ...job,
          status: false,
        }
      }), {})

    Object.keys(this.entities).forEach(job => pm2.stop(job))

    pm2.list((err, payload) => {
      if (!err) {
        payload
          .filter(job => Object.keys(this.entities).includes(job.name))
          .forEach(job => {
            if (this.entities[job.name].status !== status[job.pm2_env.status]) {
              this.entities[job.name].status = status[job.pm2_env.status]
              this.emit('change', { job: this.entities[job.name] })
            }
          })
      }
    })

    pm2.launchBus((err, bus) => bus.on('process:*', (e, data) => {
      if (Object.keys(this.entities).includes(data.process.name)) {
        if (this.entities[data.process.name].status !== status[data.event]) {
          this.entities[data.process.name].status = status[data.event]
          this.emit('change', { job: this.entities[data.process.name] })
        }
      }
    }))
  }

  status() {
    return Object.keys(this.entities)
      .reduce((acc, key) => ({ ...acc, [key]: this.entities[key].status }), {})
  }
}

module.exports = new Jobs()
