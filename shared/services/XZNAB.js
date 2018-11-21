const X2J = require('xml2json-light')

module.exports = class XZNAB {
  constructor({ name, key, url }, { proxify, headers }) {
    this.name = name
    this.key = key
    this.url = url

    this.options = {
      proxify,
      headers: headers || {},
    }
  }

  build(params = {}) {
    params.format = 'json'
    params.apikey = this.key

    const target = `${this.url}?${Object.keys(params).map(key => `${key}=${params[key]}`).join('&')}`

    if (this.options.proxify) {
      return [`/proxy?url=${window.btoa(target)}`, {
        headers: new Headers({
          'Content-Type': 'application/json; charset=utf-8',
          ...this.options.headers,
        }),
      }]
    } else {
      return [target]
    }
  }

  search(query) {
    return fetch(...this.build({
      q: query.toLowerCase().replace(/[^\sa-zA-Z0-9]/g, ' ').replace(/[ ]+/, ' '),
      Query: query.toLowerCase().replace(/[^\sa-zA-Z0-9]/g, ' ').replace(/[ ]+/, ' '),
      t: 'search',
      cat: '2000,2010,2020,2030,2040,2050,2060',
    }))
    .then(res => res.text())
    .then(text => {
      try {
        return JSON.parse(text)
      } catch (e) {
        const body = X2J.xml2json(text)
        const items = (typeof body.rss.channel.item === 'undefined' ? [] : Array.isArray(body.rss.channel.item) ? body.rss.channel.item : [body.rss.channel.item])
          .map(({ torznab, ...item }) => ({
            ...(torznab.reduce((obj, attr) => ({
              ...obj,
              [attr.name]: (
                !obj[attr.name] ?
                  attr.value :
                  (Array.isArray(obj[attr.name]) ? [...obj[attr.name], attr.value] : [obj[attr.name], attr.value])
              ),
            }), {})),
            ...item,
          }))
          .map(({
            downloadvolumefactor,
            minimumratio,
            minimumseedtime,
            pubDate,
            uploadvolumefactor,
            ...item
          }) => ({
            ...item,
            enclosure: item.enclosure.url,
            grabs: parseInt(item.grabs),
            size: parseInt(item.size),
            downloadVolumeFactor: parseInt(downloadvolumefactor),
            minimumRatio: parseInt(minimumratio),
            minimumSeedTime: parseInt(minimumseedtime),
            peers: parseInt(item.peers),
            publishDate: pubDate,
            seeders: parseInt(item.seeders),
            site: item.link.split(`${body.rss.channel.atom.href}dl/`).pop().split('/').shift(),
            uploadVolumeFactor: parseInt(uploadvolumefactor),
            category: Array.isArray(item) ? item.category.map(category => parseInt(category)) : parseInt(item.category),
          }))

        return { items }
      }
    })
    .then(payload => camelize(payload))
    .catch((e) => {
      console.warn(e)
      return { items: [] }
    })
  }
}

function camelize(obj) {
  switch (typeof obj) {
    case 'string':
      return obj
    case 'number':
      return obj
    case 'boolean':
      return obj
    default:
      if (Array.isArray(obj)) {
        return obj.map(value => camelize(value))
      } else if (obj instanceof Date) {
        return obj
      } else if (obj === null) {
        return obj
      } else {
        return Object.keys(obj).reduce((acc, key) => ({
          ...acc,
          [key.toUpperCase() === key ? key.toLowerCase() : `${key.charAt(0).toLowerCase()}${key.slice(1)}`]: camelize(obj[key])
        }), {})
      }
  }
}
