export type TorrentFiles = { name: string, files: { path: string, size: number }[] }

export const MAX_TORRENT_FILES = 20000

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
  const digits = colon < 0 ? '' : text(buffer, i, colon)
  if (!/^\d+$/.test(digits) || colon + 1 + Number(digits) > buffer.length) {
    throw new Error('Invalid .torrent, bad string length')
  }

  return [text(buffer, colon + 1, colon + 1 + Number(digits)), colon + 1 + Number(digits)]
}

// Segments come from an indexer and end up joined to the staging folder
const segmentsOf = (segments: any[]): string[] => {
  if (!Array.isArray(segments) || !segments.length || segments.some((segment) => typeof segment !== 'string' || ['', '.', '..'].includes(segment) || /[\\/]/.test(segment))) {
    throw new Error('Invalid .torrent, unsafe path')
  }

  return segments
}

// A v2 file tree keys a file by its path segments, and its length under an empty key
const treeOf = (tree: any, parents: string[] = []): { path: string[], length: number }[] => Object.entries(tree || {}).flatMap(([segment, node]: [string, any]) => (
  node?.[''] ? [{ path: [...parents, segment], length: node[''].length }] : treeOf(node, [...parents, segment])
))

// Paths are relative to the download folder: a multi-file torrent is saved under a folder named after it.
// The padding files of a hybrid torrent are never written to disk.
export const torrentFiles = (buffer: Uint8Array): TorrentFiles => {
  const [root] = decode(buffer, 0)
  const info = root?.info

  if (!info) {
    throw new Error('Invalid .torrent, no info')
  }

  const [name] = segmentsOf([info.name])
  const tree = (info.files || info.length !== undefined) ? [] : treeOf(info['file tree'])
  const entries = info.files ? info.files
    .filter(({ attr, path }) => !`${attr || ''}`.includes('p') && path?.[0] !== '.pad')
    .map(({ path, length }) => ({ path: [name, ...segmentsOf(path)], length }))
    : info.length !== undefined ? [{ path: [name], length: info.length }]
    : (tree.length === 1 && tree[0].path.join('/') === name) ? tree
    : tree.map(({ path, length }) => ({ path: [name, ...segmentsOf(path)], length }))

  if (entries.length > MAX_TORRENT_FILES) {
    throw new Error('Invalid .torrent, too many files')
  }

  if (!entries.length || entries.some(({ length }) => !Number.isInteger(length) || length < 0)) {
    throw new Error('Invalid .torrent, bad file length')
  }

  return {
    name,
    files: entries.map(({ path, length }) => ({ path: path.join('/'), size: length })),
  }
}
