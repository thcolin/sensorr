import { BadGatewayException, Controller, Get, Query } from './shims/nest-common'
import { INDEXER, searchOf } from '../releases'
import { tmdb } from '../../store/tmdb'

// Stands for `apps/api/src/app/proxy/proxy.controller.ts`: the page reaches its indexers through `/api/proxy`, and
// the demo has one, which answers here as a Torznab indexer answers in JSON
@Controller('proxy')
export class ProxyController {
  @Get()
  async get(@Query('target') target: string) {
    const url = new URL(target)

    if (!`${url.origin}${url.pathname}`.startsWith(INDEXER.url)) {
      throw new BadGatewayException(`The demo only reaches its own indexer, not ${url.host}`)
    }

    const params = Object.fromEntries(url.searchParams)

    if (params.t === 'caps') {
      return { caps: { searching: { 'tv-search': { available: 'yes', supportedParams: 'q,season,ep' } } } }
    }

    // A movie is searched by its title alone, and an indexer names its releases with the year, which Sensorr parses
    // to tell the title apart: the demo asks TMDB for it
    const [, title, searched] = /^(.*?)(?:\s+(\d{4}))?$/.exec((params.q || '').trim())
    const year = searched || (params.t === 'tvsearch' ? undefined : await tmdb.fetch('search/movie', { query: title })
      .then(({ results }) => `${results?.[0]?.release_date || ''}`.slice(0, 4) || undefined)
      // Without TMDB the releases come without their year, and Sensorr finds their titles too far from the movie's
      .catch((err) => {
        console.warn(`[Demo] No year from TMDB for "${title}", the indexer answers without it:`, err)
        return undefined
      }))

    return {
      items: searchOf({
        title,
        ...(params.t === 'tvsearch' ? {
          ...(params.season ? { season: Number(params.season) } : {}),
          ...(params.ep ? { episode: Number(params.ep) } : {}),
        } : { year }),
      }),
    }
  }
}
