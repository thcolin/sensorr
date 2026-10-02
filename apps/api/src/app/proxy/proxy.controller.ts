import { createProxyMiddleware, RequestHandler } from 'http-proxy-middleware'
import { All, Controller, Logger, Next, Req, Res } from '@nestjs/common'
import { Request } from 'express'

// pathRewrite empties req.url, and req.query with it: the target is read back from the original url
export const setTargetHeaders = (proxyReq: { setHeader: (name: string, value: string) => void }, req: Pick<Request, 'originalUrl'>) => {
  const url = new URL(new URL(req.originalUrl, 'http://localhost').searchParams.get('target'))
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
        this.logger.log(`Proxy request: ${decodeURIComponent(req.query.target as string)}`)
        return decodeURIComponent(req.query.target as string)
      },
      pathRewrite: (path: string, req: Request) => {
        return ''
      },
      on: {
        proxyReq: (proxyReq, req) => setTargetHeaders(proxyReq, req as Request),
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
