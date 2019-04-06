const app = require('../../package.json')
const PlexAPI = require('plex-api')
const pinAuth = require('plex-api-pinauth')

module.exports = class Plex {
  constructor(options = {}) {
    this.url = new URL(options.url || '')
    this.pin = options.pin || {}
    this.token = options.token || ''

    this.client = new PlexAPI({
      hostname: this.url.hostname,
      port: this.url.port || 32400,
      https: this.url.protocol === 'https:',
      authenticator: pinAuth({ token: this.token }),
      options: {
        identifier: '56dc3686-4a64-4e26-9389-4d04fe588850',
        product: app.name,
        version: app.version,
        deviceName: app.name,
      }
    })
  }

  register() {
    return this.client.authenticator.getNewPin().then(pin => {
      this.pin = pin
      return pin
    })
  }

  status() {
    return new Promise((resolve, reject) => {
      if (!this.pin.code) {
        reject('Empty PIN code')
      } else {
        this.client.authenticator.checkPinForAuth(this.pin, (err, status) => {
          if (err) {
            reject(err)
          } else {
            if (status === 'authorized') {
              this.token = this.client.authenticator.token
            }

            resolve(status)
          }
        })
      }
    })
  }

  query() {}
}
