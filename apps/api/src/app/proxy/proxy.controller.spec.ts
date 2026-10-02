import { routeTarget, setTargetHeaders } from './proxy.controller'

describe('proxy target', () => {
  it('sets the host and origin of the target the router parsed, whatever pathRewrite left in the request', () => {
    const req: { query: { target?: string } } = { query: { target: 'https%3A%2F%2Fidx.example%3A9117%2Fapi%3Ft%3Dsearch%26q%3Dthe%2520matrix' } }
    const headers = {}
    expect(routeTarget(req)).toBe('https://idx.example:9117/api?t=search&q=the%20matrix')
    req.query = {}
    setTargetHeaders({ setHeader: (name, value) => { headers[name] = value } }, req)
    expect(headers).toEqual({ host: 'idx.example:9117', origin: 'https://idx.example:9117' })
  })

  it('refuses in the router a target that is no URL once decoded', () => {
    expect(() => routeTarget({ query: { target: 'http%3A%2F%2Flocalhost%253A5401%252F' } })).toThrow()
  })
})
