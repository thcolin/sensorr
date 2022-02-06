import { xml2json } from 'xml2json-light'
import * as oleoo from 'oleoo'
import { Znab as ZnabInterface } from './interfaces'

export class Znab {
  name: string
  url: string
  key: string
  disabled: boolean
  options?: {
    proxify?: boolean,
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

    const target = `${this.url}?${Object.entries(params).map(([key, param]) => `${key}=${encodeURIComponent(param as string)}`).join('&')}`

    if (this.options.proxify) {
      return [`/api/proxy?target=${encodeURIComponent(target)}`]
    } else {
      return [target]
    }
  }

  async search(query, initial = {}) {
    const [resource, init = {}] = this.build({
      q: query,
      Query: query,
      t: 'search',
      cat: '2000,2010,2020,2030,2040,2050,2060',
    }) as [string, RequestInit]

    const res = await fetch(resource, { ...initial, ...init })

    if (!res.ok) {
      throw new Error(`[ZNAB][${this.name}] ${res.url} ${res.status}: ${res.statusText}`)
    }

    const body = await res.text()
    await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (800 - 400 + 1) + 400)))
    const raw = normalize(body, this.url)
    return transform(raw.items, { term: query, znab: this.name })
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
      .map(({ downloadvolumefactor, minimumratio, minimumseedtime, pubDate, uploadvolumefactor, ...item }) => ({
        ...item,
        link: [baseUrl.split('://').shift(), '://', unescape(item.enclosure?.url).split('://').pop()].join(''),
        grabs: parseInt(item.grabs),
        size: parseInt(item.size),
        downloadVolumeFactor: parseInt(downloadvolumefactor),
        minimumRatio: parseInt(minimumratio),
        minimumSeedTime: parseInt(minimumseedtime),
        peers: parseInt(item.peers),
        publishDate: new Date(pubDate),
        seeders: parseInt(item.seeders),
        site: item.link.split(`${body.rss.channel.atom.href}dl/`).pop().split('/').shift(),
        uploadVolumeFactor: parseInt(uploadvolumefactor),
        category: Array.isArray(item) ? (item as any).category.map(category => parseInt(category)) : parseInt(item.category),
      }))

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
      .map(item => ({
      ...init,
      title: item.title,
      link: decodeURIComponent(item.comments),
      publishDate: item.publishDate,
      enclosure: item.enclosure.url,
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
        ...oleoo.parse(item.title, {
          strict: false,
          flagged: true,
          defaults: {
            language: 'ENGLISH',
            resolution: 'SD',
            year: 0,
          },
        }),
        ...init,
      },
    }))
    .reduce((acc, item) => ({ ...acc, [item.link]: item }), {})
  )
}
