import { BadGatewayException, Controller, Get, Query } from './shims/nest-common'
import { INDEXER, searchOf } from '../releases'

// Stands for `apps/api/src/app/proxy/proxy.controller.ts`: the page reaches its indexers through `/api/proxy`, and
// the demo has one, which answers here as a Torznab indexer answers in JSON
@Controller('proxy')
export class ProxyController {
  @Get()
  get(@Query('target') target: string) {
    const url = new URL(target)

    if (!`${url.origin}${url.pathname}`.startsWith(INDEXER.url)) {
      throw new BadGatewayException(`The demo only reaches its own indexer, not ${url.host}`)
    }

    const params = Object.fromEntries(url.searchParams)

    if (params.t === 'caps') {
      return { caps: { searching: { 'tv-search': { available: 'yes', supportedParams: 'q,season,ep' } } } }
    }

    // A movie is searched as its title then its year
    const [, title, year] = /^(.*?)(?:\s+(\d{4}))?$/.exec((params.q || '').trim())

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
