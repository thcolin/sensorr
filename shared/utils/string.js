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

    return position === str.length ? str : `${str.substring(0, position - 1).trimEnd()}${options.ellipsis}`
  },
}
