const request = require('request')
const atob = require('atob')
const escape = require('escape-string-regexp')
const Config = require('@server/store/config')
const loggers = require('@server/utils/loggers')
const log = loggers.default

function proxy(req, res) {
  const url = atob(req.query.url)

  // if (Config.payload.xznabs.some(xznab => url.match(new RegExp(`^${escape(new URL(xznab.url).origin)}`)))) {
    log('proxy', { url })
    req.pipe(request(url)).pipe(res)
  // } else{
  //   log('proxy', { url, query: req.query }, { err: true })
  //   res.status(403).send({ message: 'Blacklisted URL' })
  // }
}

module.exports = proxy
