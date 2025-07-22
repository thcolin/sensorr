const fs = require('fs')
const path = require('path')
const loggers = require('@server/utils/loggers')
const log = loggers.default
const { paths } = require('@shared/utils/constants')
const rateLimit = require('express-rate-limit') // Import rate-limit middleware

let html = ''

try {
  fs.accessSync(path.join(paths.dist, 'index.html'), fs.constants.R_OK)
  html = fs.readFileSync(path.join(paths.dist, 'index.html'), 'utf8')
} catch(e) {
  html = fs.readFileSync(path.join(paths.src, 'views', 'index.html'), 'utf8')
    .replace(/<script>var config = .*?<\/script>/, '<script>var config = "__WEBPACK_INJECT_CONFIG__"</script>')
}

// Define rate limiting for the production endpoint
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // Limit each IP to 100 requests per windowMs
})

const production = function (req, res) {
  fs.readFile(path.join(paths.config, 'config.json'), 'utf8', (err, data) => {
    if (!err) {
      try {
        config = JSON.parse(data)
      } catch(e) {}
    }

    log('serve', { file: 'index.html' })
    res.send(html.replace(/"__WEBPACK_INJECT_CONFIG__"/, JSON.stringify({ ...config, env: 'production' })))
  })
}

module.exports = [limiter, production] // Apply rate limiter to the endpoint
