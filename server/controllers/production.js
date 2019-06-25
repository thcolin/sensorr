const fs = require('fs')
const path = require('path')
const loggers = require('@server/utils/loggers')
const log = loggers.default

let html = ''

try {
  fs.accessSync(path.join(__dirname, '..', '..', 'dist', 'index.html'), fs.constants.R_OK)
  html = fs.readFileSync(path.join(__dirname, '..', '..', 'dist', 'index.html'), 'utf8')
} catch(e) {
  html = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'views', 'index.html'), 'utf8')
    .replace(/<script>var config = .*?<\/script>/, '<script>var config = "__WEBPACK_INJECT_CONFIG__"</script>')
}

const production = function (req, res) {
  fs.readFile(path.join(__dirname, '..', '..', 'config', 'config.json'), 'utf8', (err, data) => {
    if (!err) {
      try {
        config = JSON.parse(data)
      } catch(e) {}
    }

    log('serve', { file: 'index.html' })
    res.send(html.replace(/"__WEBPACK_INJECT_CONFIG__"/, JSON.stringify({ ...config, env: 'production' })))
  })
}

module.exports = production
