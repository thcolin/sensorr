export default class XZNAB {
  constructor({ key, base }) {
    this.key = key
    this.base = base
  }

  build(params = {}) {
    params.format = 'json'
    params.apikey = this.key

    return `${this.base}/api?${Object.keys(params).map(key => `${key}=${params[key]}`).join('&')}`
  }

  search(query) {
    return fetch(this.build({
      q: query.toLowerCase().replace(/!/g, ''),
      t: 'search', cat: '2000,2010,2020,2030,2040,2050,2060',
    })).then(res => res.json())
  }
}
