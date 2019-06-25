const fs = require('fs')
const package = require('@root/package.json')
const chalk = require('chalk')

async function help({ log }) {
  const text = fs.createReadStream(`${__dirname}/../templates/help`)
  text.pipe(process.stderr)
  await new Promise(resolve => text.on('end', resolve))
  log('')
}

async function version({ log }) {
  log(`${chalk.bold(package.name)} v${package.version}`)
  log('')
}

module.exports = {
  version,
  help,
}
