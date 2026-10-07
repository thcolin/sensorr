// Serves the repository on http://127.0.0.1:4381, so the tile pages in tmp/readme/tiles/ load their captures and posters.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const root = path.resolve(new URL('../..', import.meta.url).pathname)
const types = { '.html': 'text/html', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end() }
  res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' })
  fs.createReadStream(file).pipe(res)
}).listen(4381, '127.0.0.1')
