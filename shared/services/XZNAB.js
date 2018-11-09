module.exports = class XZNAB {
  constructor({ name, key, url }) {
    this.name = name
    this.key = key
    this.url = url
  }

  build(params = {}) {
    params.format = 'json'
    params.apikey = this.key

    return `${this.url}/api?${Object.keys(params).map(key => `${key}=${params[key]}`).join('&')}`
  }

  search(query) {
    return fetch(this.build({
      q: query.toLowerCase().replace(/[^\sa-zA-Z0-9]/g, ' ').replace(/[ ]+/, ' '),
      t: 'search',
      cat: '2000,2010,2020,2030,2040,2050,2060',
    }))
    .then(res => res.json())
    .then(payload => camelize(payload))
    .catch(() => ({ items: [] }))
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
      } else {
        return Object.keys(obj).reduce((acc, key) => ({
          ...acc,
          [key.toUpperCase() === key ? key.toLowerCase() : `${key.charAt(0).toLowerCase()}${key.slice(1)}`]: camelize(obj[key])
        }), {})
      }
  }
}
