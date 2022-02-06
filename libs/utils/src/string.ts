export const truncate = (
  str: string,
  limit: number = 300,
  options: { ellipsis?: string } = { ellipsis: '...' },
): string => {
  const sentences = str.split(/[\.\,\;\?\!]+/)
  const position = Math.abs(
    sentences.reduce(
      (length, sentence) =>
        length < 0 ? length : limit > length + sentence.length ? length + sentence.length + 1 : -Math.abs(length),
      0,
    ),
  )

  return position === str.length + 1
    ? str
    : `${str.substring(0, position - 1).trimEnd()}${position > 1 ? options.ellipsis : ''}`
}

export const humanize = {
  time: (value: string) => {
    const hours = Math.floor(parseInt(value) / 60)
    const minutes = Math.floor(parseInt(value) % 60)

    return [
      (hours > 0 ? `${hours}h` : ''),
      (!hours || minutes ? `${minutes}m` : ''),
    ].join(' ')
  },
}

export const emojize = (emoji: string, label?: string|number) => `${emoji}${' '}${label || ''}`

const units = ['B', 'KB', 'MB', 'GB', 'TB']

export const filesize = {
  parse: (string) => {
    const unit = (string.match(new RegExp([...units].reverse().join('|'))) || ['B'])[0]
    return units.includes(unit) ? parseInt(string) * Math.pow(1024, units.indexOf(unit)) : 0
  },
  stringify: (bytes, unit = true) => {
    const exponent = bytes == 0 ? 0 : Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, exponent)).toFixed(2) as any * 1} ${unit ? units[exponent] : ''}`
  },
}
