const units = ['B', 'KB', 'MB', 'GB', 'TB']

module.exports = {
  parse: (string) => {
    const unit = (string.match(new RegExp([...units].reverse().join('|'))) || ['B'])[0]
    return units.includes(unit) ? parseInt(string) * Math.pow(1024, units.indexOf(unit)) : 0
  },
  stringify: (bytes, unit = true) => {
    const exponent = bytes == 0 ? 0 : Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, exponent)).toFixed(2) * 1} ${unit ? units[exponent] : ''}`
  }
}
