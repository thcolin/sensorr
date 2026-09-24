import { xml2json } from 'xml2json-light'
import oleoo from 'oleoo'
import { decode as unescape } from 'html-entities'
import { Znab as ZnabInterface } from './interfaces'

export class Znab {
  name: string
  url: string
  key: string
  disabled: boolean
  options?: {
    proxify?: boolean,
  }
  caps?: {
    tvsearch: string[],
  }

  constructor({ name, url, key, disabled }: ZnabInterface, { proxify }: { proxify?: boolean }) {
    this.name = name
    this.url = url
    this.key = key
    this.disabled = disabled

    this.options = {
      proxify,
    }
  }

  build(params = {} as any) {
    params.format = 'json'
    params.apikey = this.key

    const target = `?${Object.entries(params).map(([key, param]) => `${key}=${encodeURIComponent(param as string)}`).join('&')}`

    if (this.options.proxify) {
      // TODO: Should secure proxy with a secret key or something
      return [`/api/proxy?target=${encodeURIComponent(`${this.url}${target}`)}`]
    } else {
      return [`${this.url}${target}`]
    }
  }

  async request(params, initial = {}) {
    const [resource, init = {}] = this.build(params) as [string, RequestInit]

    const res = await fetch(resource, { ...initial, ...init } as any)

    if (!res.ok) {
      throw new Error(`[ZNAB][${this.name}] ${res.status} (${res.statusText}): ${res.url}`)
    }

    const body = await res.text()
    await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (800 - 400 + 1) + 400)))
    return normalize(body, this.url)
  }

  async search(query, initial = {}) {
    const raw = await this.request({
      q: query,
      Query: query,
      t: 'search',
      cat: '2000,2010,2020,2030,2040,2050,2060,2070,2080,2090,5080',
    }, initial)

    return transform(raw.items, { term: query, znab: this.name })
  }

  // An indexer that cannot answer caps is searched as free text
  async capabilities(initial = {}) {
    if (!this.caps) {
      const [resource, init = {}] = this.build({ t: 'caps' }) as [string, RequestInit]

      try {
        const res = await fetch(resource, { ...initial, ...init } as any)
        this.caps = res.ok ? parseCaps(await res.text()) : { tvsearch: [] }
      } catch (e) {
        if (e.name === 'AbortError') {
          throw e
        }

        this.caps = { tvsearch: [] }
      }
    }

    return this.caps
  }

  async searchShow(term, { season, episode }: { season?: number, episode?: number } = {}, initial = {}) {
    const { tvsearch } = await this.capabilities(initial)
    const params = { q: term, ...(season === undefined ? {} : { season }), ...(episode === undefined ? {} : { ep: episode }) }
    const tv = Object.keys(params).every(param => tvsearch.includes(param))
    const q = tv ? term : [term, [
      season === undefined ? '' : `S${String(season).padStart(2, '0')}`,
      episode === undefined ? '' : `E${String(episode).padStart(2, '0')}`,
    ].join('')].filter(Boolean).join(' ')

    const raw = await this.request({
      ...(tv ? params : { q }),
      Query: q,
      t: tv ? 'tvsearch' : 'search',
      cat: '5000,5010,5020,5030,5040,5045,5050,5060,5070,5080',
    }, initial)
    const categories = new Map(raw.items.map(item => [item.link, [].concat(item.category ?? []).map(Number).filter(Number.isFinite)]))

    return transform(raw.items, { term: q, znab: this.name }).map((release: any) => ({ ...release, category: categories.get(release.link) }))
  }
}

// xml2json-light names the `tv-search` element `tv`
function parseCaps(body) {
  let caps

  try {
    const json = JSON.parse(body)
    caps = json?.caps || json
  } catch (e) {
    caps = xml2json(body)?.caps
  }

  const node = caps?.searching?.['tv-search'] || caps?.searching?.tv
  const attributes = node?.['@attributes'] || node || {}

  return {
    tvsearch: attributes.available === 'yes' ? String(attributes.supportedParams || '').split(',').map(param => param.trim()).filter(Boolean) : [],
  }
}

function normalize(raw, baseUrl) {
  try {
    return camelize(JSON.parse(raw))
  } catch (e) {
    const body = xml2json(raw)
    const items = (typeof (body.rss || { channel: {} }).channel.item === 'undefined' ? [] : Array.isArray(body.rss.channel.item) ? body.rss.channel.item : [body.rss.channel.item])
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
      .map(({ downloadvolumefactor, minimumratio, minimumseedtime, pubDate, uploadvolumefactor, ...item }) => {
        const enclosure = new URL(unescape(item.enclosure?.url))
        enclosure.protocol = (new URL(baseUrl)).protocol
        enclosure.host = (new URL(baseUrl)).host

        return ({
          ...item,
          link: decodeURIComponent(item.comments),
          enclosure: enclosure.href,
          grabs: Number(item.grabs),
          size: Number(item.size),
          downloadVolumeFactor: Number(downloadvolumefactor),
          minimumRatio: Number(minimumratio),
          minimumSeedTime: Number(minimumseedtime),
          peers: Number(item.peers),
          publishDate: new Date(pubDate),
          seeders: Number(item.seeders),
          site: item.link.split(`${body.rss.channel.atom.href}dl/`).pop().split('/').shift(),
          uploadVolumeFactor: Number(uploadvolumefactor),
          category: Array.isArray(item.category) ? item.category.map(category => Number(category)) : Number(item.category),
        })
      })

    return camelize({ ...(body.rss || {}), items })
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

function transform(items, init) {
  return Object.values(items
      .map(item => {
        let meta

        try {
          meta = oleoo.parse(item.title, {
            strict: false,
            flagged: true,
            defaults: {
              language: 'VO',
              resolution: 'SD',
              year: '0',
            },
          })
        } catch (e) {
          // oleoo refuses a name past 1024 characters or a range past 9999 episodes: drop that result, not the search
          return null
        }

        return ({
          ...init,
          id: item.guid,
          title: meta.generated,
          original: item.title,
          link: item.link,
          publishDate: item.publishDate,
          enclosure: item.enclosure,
          size: item.size,
          peers: item.peers,
          seeders: item.seeders,
          leechers: item.peers - item.seeders,
          grabs: item.grabs,
          similarity: 0,
          score: 0,
          valid: true,
          reason: null,
          warning: 0,
          meta: {
            ...meta,
            ...init,
          },
        })
      })
      .filter(Boolean)
    .reduce((acc, item) => ({ ...acc, [item.link]: item }), {})
  )
}
