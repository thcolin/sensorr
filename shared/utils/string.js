const similarity = require('string-similarity')

module.exports = {
  similarity: (a, b) => similarity.compareTwoStrings(a, b),
  clean: (string) => string
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\sa-zA-Z0-9]/g, ' ')
    .replace(/ +/g, ' ')
    .trim(),
  truncate: (str, limit = 300, options = { ellipsis: '...' }) => {
    const sentences = str.split(/[\.\,\;\?\!]+/)
    const position = Math.abs(sentences.reduce((length, sentence) =>
      length < 0 ?
      length :
      limit > length + sentence.length ?
      length + sentence.length + 1 :
      -Math.abs(length),
      0,
    ))

    return position === str.length ? str : `${str.substring(0, position - 1).trimEnd()}${position > 1 ? options.ellipsis : ''}`
  },
  capitalize: (str, forceLowerCase = false) => `${str.charAt(0).toUpperCase()}${str.substring(1)[forceLowerCase ? 'toLowerCase' : 'toString']()}`,
  humanize: {
    time: (value) => {
      const hours = parseInt(value / 60)
      const minutes = parseInt(value % 60)

      return [
        (hours > 0 ? `${hours}h` : ''),
        (!hours || minutes ? `${minutes}m` : ''),
      ].join(' ')
    },
    // or "commarize"
    bigint: (input) => {
      const value = parseInt(input) || 0

      // Alter numbers larger than 1k
      if (value >= 1e3) {
        var units = ['k', 'M', 'B', 'T'];

        // Divide to get SI Unit engineering style numbers (1e3,1e6,1e9, etc)
        let unit = Math.floor(((value).toFixed(0).length - 1) / 3) * 3
        // Calculate the remainder
        var num = (value / ('1e'+unit)).toFixed(0)
        var unitname = units[Math.floor(unit / 3) - 1]

        // output number remainder + unitname
        return num + unitname
      }

      // return formatted original number
      return value.toLocaleString()
    },
  },
}
