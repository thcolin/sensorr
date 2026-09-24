// HTTP/2 over TLS in front of `nx run web:serve`, so several tabs share one connection: over HTTP/1.1,
// each tab's SSE streams take up Chrome's six connections per host and the next tab hangs.
// Usage: node tools/dev/h2-front.mjs [listen port = 4443] [dev server port = 4200]
import http2 from 'node:http2'
import http from 'node:http'
import net from 'node:net'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'

const [listen = 4443, upstream = 4200] = process.argv.slice(2).map(Number)
const dir = new URL('../../tmp/h2-front/', import.meta.url).pathname
const hop = ['connection', 'keep-alive', 'proxy-connection', 'transfer-encoding', 'upgrade', 'http2-settings', 'host']
const strip = (headers) => Object.fromEntries(Object.entries(headers).filter(([k]) => !k.startsWith(':') && !hop.includes(k)))

if (!existsSync(dir + 'cert.pem')) {
  mkdirSync(dir, { recursive: true })
  try {
    execFileSync('mkcert', ['-cert-file', dir + 'cert.pem', '-key-file', dir + 'key.pem', 'localhost', '127.0.0.1', '::1'], { stdio: 'inherit' })
  } catch (e) {
    console.error(`[h2-front] mkcert failed (${e.code || e.status}): install it, or run \`nx run web:serve\` for HTTP/1.1 on http://localhost:${upstream}`)
    process.exit(1)
  }
}

const server = http2.createSecureServer({ allowHTTP1: true, key: readFileSync(dir + 'key.pem'), cert: readFileSync(dir + 'cert.pem') }, (req, res) => {
  const up = http.request({ host: 'localhost', port: upstream, method: req.method, path: req.url, headers: { ...strip(req.headers), host: `localhost:${upstream}` } }, (r) => {
    res.writeHead(r.statusCode, strip(r.headers))
    r.pipe(res)
  })
  up.on('error', () => (res.headersSent ? res.destroy() : res.writeHead(502).end()))
  res.on('close', () => res.writableFinished || up.destroy())
  req.pipe(up)
})

// Chrome and Firefox open WebSockets, the HMR one included, on a separate HTTP/1.1 connection
// unless the server enables RFC 8441; this pipes that upgrade to the dev server untouched.
server.on('upgrade', (req, socket, head) => {
  const up = net.connect(upstream, 'localhost', () => {
    const lines = []
    for (let i = 0; i < req.rawHeaders.length; i += 2) lines.push(`${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}`)
    up.write(`${req.method} ${req.url} HTTP/1.1\r\n${lines.join('\r\n')}\r\n\r\n`)
    up.write(head)
    socket.pipe(up).pipe(socket)
  })
  up.on('error', () => socket.destroy())
  socket.on('error', () => up.destroy())
})

server.listen(listen, 'localhost', () => console.log(`[h2-front] https://localhost:${listen} -> http://localhost:${upstream}`))
