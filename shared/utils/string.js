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
}
