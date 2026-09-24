import { torrentFiles } from './torrent'

const bencode = (value): string => {
  if (typeof value === 'number') {
    return `i${value}e`
  }

  if (typeof value === 'string') {
    return `${Buffer.byteLength(value)}:${value}`
  }

  if (Array.isArray(value)) {
    return `l${value.map(bencode).join('')}e`
  }

  return `d${Object.keys(value).sort().map((key) => `${bencode(key)}${bencode(value[key])}`).join('')}e`
}

const torrent = (info) => Buffer.from(bencode({ announce: 'http://tracker/announce', info: { 'piece length': 262144, pieces: 'abcdefghijklmnopqrst', ...info } }))

describe('torrentFiles', () => {
  it('lists every file of a multi-file torrent under the torrent folder', () => {
    expect(torrentFiles(torrent({
      name: 'Show.S01.1080p.WEB-GRP',
      files: [
        { length: 1500000000, path: ['Show.S01E01.1080p.WEB-GRP.mkv'] },
        { length: 12, path: ['Subs', 'Show.S01E01.srt'] },
      ],
    }))).toEqual({
      name: 'Show.S01.1080p.WEB-GRP',
      files: [
        { path: 'Show.S01.1080p.WEB-GRP/Show.S01E01.1080p.WEB-GRP.mkv', size: 1500000000 },
        { path: 'Show.S01.1080p.WEB-GRP/Subs/Show.S01E01.srt', size: 12 },
      ],
    })
  })

  it('lists a single-file torrent as its name', () => {
    expect(torrentFiles(torrent({ name: 'Show.S01E01.1080p.WEB-GRP.mkv', length: 734003200 }))).toEqual({
      name: 'Show.S01E01.1080p.WEB-GRP.mkv',
      files: [{ path: 'Show.S01E01.1080p.WEB-GRP.mkv', size: 734003200 }],
    })
  })

  it('reads UTF-8 names', () => {
    expect(torrentFiles(torrent({ name: 'Série.é.mkv', length: 1 })).name).toBe('Série.é.mkv')
  })

  it('throws on a truncated file', () => {
    const buffer = torrent({ name: 'Show.S01E01.mkv', length: 1 })
    expect(() => torrentFiles(buffer.subarray(0, buffer.length - 10))).toThrow('Invalid .torrent')
  })
})
