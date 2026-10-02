import { setTargetHeaders } from './proxy.controller'

describe('setTargetHeaders', () => {
  it('reads the target from the original url once pathRewrite emptied the request url', () => {
    const headers = {}
    setTargetHeaders({ setHeader: (name, value) => { headers[name] = value } }, { originalUrl: '/api/proxy?target=https%3A%2F%2Fidx.example%3A9117%2Fapi%3Ft%3Dsearch%26q%3Dmatrix' })
    expect(headers).toEqual({ host: 'idx.example:9117', origin: 'https://idx.example:9117' })
  })
})
