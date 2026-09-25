import { torrentFiles, MAX_TORRENT_FILES } from './torrent'

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

  it('throws on a string length that is not a plain number, instead of looping on it', () => {
    for (const raw of ['l-3:e', 'd4:infol-3:ee', 'l-4:e', 'd4:info d4:name1:aee', 'l+1:ae']) {
      expect(() => torrentFiles(Buffer.from(raw))).toThrow('Invalid .torrent, bad string length')
    }
  })

  it('leaves out the padding files of a hybrid torrent', () => {
    expect(torrentFiles(torrent({
      name: 'Show.S01.1080p.WEB-GRP',
      files: [
        { length: 1500000000, path: ['Show.S01E01.1080p.WEB-GRP.mkv'] },
        { length: 16384, path: ['.pad', '16384'], attr: 'p' },
        { length: 1400000000, path: ['Show.S01E02.1080p.WEB-GRP.mkv'] },
        { length: 4096, path: ['.pad', '4096'] },
      ],
    })).files).toEqual([
      { path: 'Show.S01.1080p.WEB-GRP/Show.S01E01.1080p.WEB-GRP.mkv', size: 1500000000 },
      { path: 'Show.S01.1080p.WEB-GRP/Show.S01E02.1080p.WEB-GRP.mkv', size: 1400000000 },
    ])
  })

  it('reads the file tree of a v2 torrent', () => {
    expect(torrentFiles(torrent({
      name: 'Show.S01.1080p.WEB-GRP',
      'file tree': {
        'Show.S01E01.1080p.WEB-GRP.mkv': { '': { length: 1500000000, 'pieces root': 'x' } },
        Subs: { 'Show.S01E01.srt': { '': { length: 12 } } },
      },
    })).files).toEqual([
      { path: 'Show.S01.1080p.WEB-GRP/Show.S01E01.1080p.WEB-GRP.mkv', size: 1500000000 },
      { path: 'Show.S01.1080p.WEB-GRP/Subs/Show.S01E01.srt', size: 12 },
    ])

    expect(torrentFiles(torrent({
      name: 'Show.S01E01.1080p.WEB-GRP.mkv',
      'file tree': { 'Show.S01E01.1080p.WEB-GRP.mkv': { '': { length: 734003200 } } },
    })).files).toEqual([{ path: 'Show.S01E01.1080p.WEB-GRP.mkv', size: 734003200 }])
  })

  it('throws on a path that leaves the download folder', () => {
    expect(() => torrentFiles(torrent({ name: '..', files: [{ length: 1, path: ['Show.S01E01.mkv'] }] }))).toThrow('Invalid .torrent, unsafe path')
    expect(() => torrentFiles(torrent({ name: 'Show.S01', files: [{ length: 1, path: ['..', 'Show.S01E01.mkv'] }] }))).toThrow('Invalid .torrent, unsafe path')
    expect(() => torrentFiles(torrent({ name: 'Show.S01', files: [{ length: 1, path: ['/etc/passwd'] }] }))).toThrow('Invalid .torrent, unsafe path')
    expect(() => torrentFiles(torrent({ name: '', length: 1 }))).toThrow('Invalid .torrent, unsafe path')
  })

  it('throws on a file without a length, and on too many files', () => {
    expect(() => torrentFiles(torrent({ name: 'Show.S01E01.mkv' }))).toThrow('Invalid .torrent, bad file length')
    expect(() => torrentFiles(torrent({
      name: 'Show.S01',
      files: Array.from({ length: MAX_TORRENT_FILES + 1 }, (_, index) => ({ length: 1, path: [`${index}.srt`] })),
    }))).toThrow('Invalid .torrent, too many files')
  })
})
