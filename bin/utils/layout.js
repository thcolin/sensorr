const fs = require('fs')
const chalk = require('chalk')

async function header({ log }) {
  const text = fs.createReadStream(`${__dirname}/../templates/logo`)
  text.pipe(process.stderr)
  await new Promise(resolve => text.on('end', resolve))
  log('')
  log('🍿 📼', ' - ', `${chalk.bold('Movie release radar')} (CouchPotato, Radarr and Watcher3 alternative)`)
  log('')
}

module.exports = {
  header,
}
