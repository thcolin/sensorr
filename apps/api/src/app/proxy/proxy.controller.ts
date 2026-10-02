import { createProxyMiddleware, RequestHandler } from 'http-proxy-middleware'
import { All, Controller, Logger, Next, Req, Res } from '@nestjs/common'
import { Request } from 'express'

const targets = new WeakMap<object, URL>()

// Parsed in the router, where a throw reaches next(): proxyReq fires outside any handler, once pathRewrite has emptied req.query
export const routeTarget = (req: Pick<Request, 'query'>) => {
  const target = decodeURIComponent(req.query.target as string)
  targets.set(req, new URL(target))
  return target
}

export const setTargetHeaders = (proxyReq: { setHeader: (name: string, value: string) => void }, req: object) => {
  const url = targets.get(req)
  proxyReq.setHeader('host', url.host)
  proxyReq.setHeader('origin', url.origin)
}

@Controller('/proxy')
export class ProxyController {
  private readonly logger = new Logger(ProxyController.name)
  private readonly proxy: RequestHandler

  constructor() {
    this.proxy = createProxyMiddleware({
      router: (req: Request) => {
        const target = routeTarget(req)
        this.logger.log(`Proxy request: ${target}`)
        return target
      },
      pathRewrite: (path: string, req: Request) => {
        return ''
      },
      on: {
        proxyReq: setTargetHeaders,
      },
      changeOrigin: true,
      // logger: console,
    })
  }

  @All()
  get(@Req() req, @Res() res, @Next() next) {
    // TODO: Should secure proxy with a secret key or something
    this.proxy(req, res, next)
  }
}
