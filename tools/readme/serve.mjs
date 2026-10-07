// Serves init.js on http://127.0.0.1:4449, for a Chrome initScript that loads it by synchronous XHR before the app boots.
import http from 'node:http'
import fs from 'node:fs'
http.createServer((req, res) => {
  res.setHeader('access-control-allow-origin', '*')
  res.setHeader('content-type', 'text/javascript')
  res.end(fs.readFileSync(new URL('./init.js', import.meta.url)))
}).listen(4449, '127.0.0.1')
