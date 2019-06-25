const chalk = require('chalk')

module.exports = {
  socket: (data, { client = null, color = '', err = false } = {}) => console.log(...[
    `${chalk[color ? `bg${color.charAt(0).toUpperCase()}${color.slice(1)}` : err ? 'bgRed' : 'bgGreen'](chalk.black(' SOCKET '))}`,
    ...(client ? [`${chalk[color ? color : err ? 'red' : 'green'](`#${client.id}`)}`] : []),
    `${chalk.gray(JSON.stringify(data))}`,
  ]),
  default: (origin, data, { color = '', err = false } = {}) => console.log(...[
    `${chalk[color ? `bg${color.charAt(0).toUpperCase()}${color.slice(1)}` : err ? 'bgRed' : 'bgGreen'](chalk.black(` ${origin.toUpperCase()} `))}`,
    `${chalk.gray(JSON.stringify(data))}`,
  ]),
}
