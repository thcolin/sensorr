import { createProxyMiddleware, RequestHandler } from 'http-proxy-middleware'
import { All, Controller, Logger, Next, Req, Res } from '@nestjs/common'
import { Request } from 'express'

@Controller('/proxy')
export class ProxyController {
  private readonly logger = new Logger(ProxyController.name)
  private readonly proxy: RequestHandler

  constructor() {
    this.proxy = createProxyMiddleware({
      router: (req: Request) => {
        this.logger.log(`Proxy request: ${decodeURIComponent(req.query.target as string)}`)
        return decodeURIComponent(req.query.target as string)
      },
      pathRewrite: (path: string, req: Request) => {
        return ''
      },
      on: {
        proxyReq: (proxyReq, req) => {
          const url = new URL(req.query.target as string)
          proxyReq.setHeader('host', url.host)
          proxyReq.setHeader('origin', url.origin)
        },
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
