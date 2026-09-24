export type TorrentFiles = { name: string, files: { path: string, size: number }[] }

const text = (buffer: Uint8Array, start: number, end: number) => new TextDecoder().decode(buffer.subarray(start, end))

// Byte strings are read as UTF-8, which garbles `pieces` and nothing else that is read here
const decode = (buffer: Uint8Array, i: number): [any, number] => {
  const head = buffer[i]

  if (head === 0x69) {
    const end = buffer.indexOf(0x65, i)
    if (end < 0) {
      throw new Error('Invalid .torrent, unterminated integer')
    }

    return [Number(text(buffer, i + 1, end)), end + 1]
  }

  if (head === 0x6c || head === 0x64) {
    const items = []
    let next = i + 1

    while (buffer[next] !== 0x65) {
      if (next >= buffer.length) {
        throw new Error('Invalid .torrent, unterminated list')
      }

      const [item, after] = decode(buffer, next)
      items.push(item)
      next = after
    }

    const value = head === 0x6c ? items : Object.fromEntries(items.flatMap((item, index) => index % 2 ? [] : [[item, items[index + 1]]]))
    return [value, next + 1]
  }

  const colon = buffer.indexOf(0x3a, i)
  const length = Number(text(buffer, i, colon))
  if (colon < 0 || !Number.isInteger(length) || colon + 1 + length > buffer.length) {
    throw new Error('Invalid .torrent, bad string length')
  }

  return [text(buffer, colon + 1, colon + 1 + length), colon + 1 + length]
}

// Paths are relative to the download folder: a multi-file torrent is saved under a folder named after it
export const torrentFiles = (buffer: Uint8Array): TorrentFiles => {
  const [{ info }] = decode(buffer, 0)

  return {
    name: info.name,
    files: info.files
      ? info.files.map(({ path, length }) => ({ path: [info.name, ...path].join('/'), size: length }))
      : [{ path: info.name, size: info.length }],
  }
}
