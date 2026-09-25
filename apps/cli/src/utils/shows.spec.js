import { isRefreshDue, monitoredOf, sonarrShowOf, sonarrEpisodesOf, REFRESH_AFTER, isImportable, isReleaseFinished, showFolderOf, importTargetOf, importLinksOf, requestedShowOf, proposalOnlyOf, airingUnits, syncedFilesOf, withdrawnProposalsOf, isReleaseOverdue, showReleaseOf, plexFilesOf, importedEpisodesOf, plexShowOf, goneEpisodesOf } from './shows'
import { OVERDUE_AFTER } from './swaps'

const now = 1790000000000

describe('isRefreshDue', () => {
  it('refreshes a show still airing on every run', () => {
    for (const status of ['Returning Series', 'In Production', 'Planned', 'Pilot']) {
      expect(isRefreshDue({ status, refreshed_at: new Date(now - 1000).toISOString() }, now)).toBe(true)
    }
  })

  it('refreshes any other show once its last refresh is 30 days old', () => {
    expect(isRefreshDue({ status: 'Ended', refreshed_at: new Date(now - REFRESH_AFTER + 1000).toISOString() }, now)).toBe(false)
    expect(isRefreshDue({ status: 'Canceled', refreshed_at: new Date(now - REFRESH_AFTER).toISOString() }, now)).toBe(true)
  })

  it('refreshes a show never refreshed', () => {
    expect(isRefreshDue({ status: 'Ended' }, now)).toBe(true)
  })
})

describe('monitoredOf', () => {
  const show = { monitored: true, monitor_new_seasons: false }
  const known = [
    { id: 1, season_number: 1, episode_number: 1, monitored: false },
    { id: 2, season_number: 1, episode_number: 2, monitored: true },
    { id: 3, season_number: 2, episode_number: 1, monitored: false },
  ]

  it('monitors a new episode of a season that already has a monitored episode', () => {
    expect(monitoredOf({ season_number: 1, episode_number: 3 }, show, known)).toBe(true)
    expect(monitoredOf({ season_number: 2, episode_number: 2 }, show, known)).toBe(false)
  })

  it('monitors a new season only when the show monitors new seasons', () => {
    expect(monitoredOf({ season_number: 3, episode_number: 1 }, show, known)).toBe(false)
    expect(monitoredOf({ season_number: 3, episode_number: 1 }, { ...show, monitor_new_seasons: true }, known)).toBe(true)
  })

  it('never monitors an episode of an unmonitored show', () => {
    expect(monitoredOf({ season_number: 1, episode_number: 3 }, { ...show, monitored: false }, known)).toBe(false)
    expect(monitoredOf({ season_number: 3, episode_number: 1 }, { monitored: false, monitor_new_seasons: true }, known)).toBe(false)
  })

  it('never monitors a special on its own', () => {
    expect(monitoredOf({ season_number: 0, episode_number: 2 }, { ...show, monitor_new_seasons: true }, [{ season_number: 0, monitored: true }])).toBe(false)
  })
})

describe('sonarrShowOf', () => {
  const series = { monitored: true, monitorNewItems: 'all', path: '/tv/Friends (1994)/', statistics: { episodeFileCount: 0 } }

  it('wishes a monitored series', () => {
    expect(sonarrShowOf(series)).toEqual({ state: 'wished', monitored: true, monitor_new_seasons: true, path: 'Friends (1994)' })
  })

  it('archives an unmonitored series with files, and skips one without any', () => {
    expect(sonarrShowOf({ ...series, monitored: false, statistics: { episodeFileCount: 3 } })).toMatchObject({ state: 'archived', monitored: false })
    expect(sonarrShowOf({ ...series, monitored: false })).toBe(null)
    expect(sonarrShowOf({ ...series, monitored: false, statistics: undefined })).toBe(null)
  })

  it('monitors new seasons only when Sonarr monitors all new items', () => {
    expect(sonarrShowOf({ ...series, monitorNewItems: 'none' }).monitor_new_seasons).toBe(false)
    expect(sonarrShowOf({ ...series, monitorNewItems: undefined }).monitor_new_seasons).toBe(false)
  })
})

describe('sonarrEpisodesOf', () => {
  const show = { monitored: true, monitor_new_seasons: false }
  const episodes = [
    { id: 1, season_number: 1, episode_number: 1 },
    { id: 2, season_number: 1, episode_number: 2 },
    { id: 3, season_number: 1, episode_number: 3 },
    { id: 4, season_number: 2, episode_number: 1 },
  ]
  const sonarr = [
    { seasonNumber: 1, episodeNumber: 1, monitored: false },
    { seasonNumber: 1, episodeNumber: 2, monitored: true },
    { seasonNumber: 1, episodeNumber: 25, monitored: true },
  ]

  it('copies monitored from Sonarr by season and episode number', () => {
    const { episodes: migrated } = sonarrEpisodesOf(episodes, sonarr, show)

    expect(migrated.slice(0, 2).map(({ monitored }) => monitored)).toEqual([false, true])
  })

  it('follows the rule of a new episode for the ones Sonarr does not number', () => {
    const { episodes: migrated } = sonarrEpisodesOf(episodes, sonarr, show)

    expect(migrated.slice(2).map(({ id, monitored }) => [id, monitored])).toEqual([[3, true], [4, false]])
  })

  it('tells the Sonarr episodes TMDB does not number', () => {
    expect(sonarrEpisodesOf(episodes, sonarr, show).unmatched).toEqual([sonarr[2]])
  })

  it('leaves unmonitored the episodes of an unmonitored series or season, as Sonarr never searches them', () => {
    expect(sonarrEpisodesOf(episodes, sonarr, { ...show, monitored: false }).episodes.map(({ monitored }) => monitored)).toEqual([false, false, false, false])
    expect(sonarrEpisodesOf(episodes, sonarr, show, [{ seasonNumber: 1, monitored: false }]).episodes.slice(0, 2).map(({ monitored }) => monitored)).toEqual([false, false])
  })

  it('gives an episode Sonarr has a file for that file, marked as coming from Sonarr', () => {
    const filed = sonarr.map((episode, index) => index === 1 ? { ...episode, hasFile: true, episodeFileId: 7 } : { ...episode, hasFile: false, episodeFileId: 0 })
    const files = [{ id: 7, size: 734003200, relativePath: 'Season 01/Show.S01E02.1080p.WEB.x264-GRP.mkv' }]
    const { episodes: migrated } = sonarrEpisodesOf(episodes, filed, show, [], files)

    expect(migrated.map(({ files }) => files?.length || 0)).toEqual([0, 1, 0, 0])
    expect(migrated[1].files[0]).toMatchObject({ id: 'sonarr:7', size: 734003200, original: 'Show.S01E02.1080p.WEB.x264-GRP', from: 'sonarr' })
    expect(migrated[0]).not.toHaveProperty('files')
  })

  it('gives a Sonarr file holding several episodes to each of them, as the same entry', () => {
    const filed = sonarr.map((episode, index) => index < 2 ? { ...episode, hasFile: true, episodeFileId: 7 } : { ...episode, hasFile: false, episodeFileId: 0 })
    const files = [{ id: 7, size: 1468006400, relativePath: 'Season 01/Show.S01E01E02.1080p.WEB.x264-GRP.mkv' }]
    const { episodes: migrated } = sonarrEpisodesOf(episodes, filed, show, [], files)

    expect(migrated.map(({ files }) => files?.length || 0)).toEqual([1, 1, 0, 0])
    expect(migrated[1].files).toEqual(migrated[0].files)
  })
})

describe('syncedFilesOf', () => {
  const files = [{ id: '1', size: 10, title: 'S01E01', original: 'Show.S01E01.mkv' }]

  it('keeps the release of an episode Plex still has', () => {
    expect(syncedFilesOf(files)).toEqual({ files })
  })

  it('drops the release of an episode Plex no longer has, so it is searched again', () => {
    expect(syncedFilesOf([])).toEqual({ files: [], release: null })
  })
})

describe('withdrawnProposalsOf', () => {
  const episodes = [
    { season_number: 4, episode_number: 1, files: [{ id: 'a' }] },
    { season_number: 4, episode_number: 2, files: [{ id: 'a' }] },
    { season_number: 4, episode_number: 3, files: [] },
  ]
  const proposal = (id, coverage, fields = {}) => ({ id, proposal: true, coverage, ...fields })

  it('withdraws a pending proposal whose covered episodes are all owned', () => {
    const releases = [
      proposal('owned', [{ season: 4, episode: 1 }, { season: 4, episode: 2 }]),
      proposal('fills', [{ season: 4, episode: 2 }, { season: 4, episode: 3 }]),
      proposal('unknown', [{ season: 4, episode: 4 }]),
    ]

    expect(withdrawnProposalsOf(releases, episodes).map(({ id }) => id)).toEqual(['owned'])
  })

  it('leaves an accepted release and a proposal without coverage', () => {
    expect(withdrawnProposalsOf([proposal('accepted', [{ season: 4, episode: 1 }], { proposal: false }), proposal('empty', [])], episodes)).toEqual([])
    expect(withdrawnProposalsOf(undefined, episodes)).toEqual([])
  })
})

describe('plexShowOf', () => {
  const library = [
    { id: 2316, name: 'The Office', first_air_date: '2005-03-24', external_ids: { tvdb_id: 73244, imdb_id: 'tt0386676' } },
    { id: 2996, name: 'The Office', first_air_date: '2001-07-09', external_ids: { tvdb_id: 78107, imdb_id: 'tt0290978' } },
  ]
  const payload = { title: 'The Office', year: 2005 }

  it('ties a Plex show by its tmdb guid first', () => {
    expect(plexShowOf({ ...payload, Guid: [{ id: 'imdb://tt0290978' }, { id: 'tmdb://2316' }] }, library)).toEqual({ id: 2316, exact: true })
  })

  it('ties a Plex show without a tmdb guid by its tvdb, then its imdb guid', () => {
    expect(plexShowOf({ ...payload, Guid: [{ id: 'tvdb://78107' }] }, library)).toEqual({ id: 2996, exact: true })
    expect(plexShowOf({ ...payload, Guid: [{ id: 'imdb://tt0386676' }] }, library)).toEqual({ id: 2316, exact: true })
  })

  it('names a Plex show without any known guid by its title and year, as not exact', () => {
    expect(plexShowOf({ title: 'the office ', year: 2001, Guid: [{ id: 'tvdb://1' }] }, library)).toEqual({ id: 2996, exact: false })
    expect(plexShowOf({ title: 'Friends', year: 1994 }, library)).toBe(null)
  })
})

describe('plexFilesOf', () => {
  const plex = [{ id: 'plex://episode/1#2', size: 10, title: 'S01E01', original: 'Show.S01E01.mkv' }]
  const imported = [{ id: 'import:Show.S01/Show.S01E01.mkv', size: 10, title: 'S01E01', original: 'Show.S01E01.mkv', from: 'import' }]
  const sonarr = [{ id: 'sonarr:12', size: 10, title: 'S01E01', original: 'Show.S01E01.mkv', from: 'sonarr' }]

  it('takes the files Plex reads in place of any other, without a loss', () => {
    expect(plexFilesOf(imported, plex)).toEqual({ files: plex, changed: true, lost: false })
    expect(plexFilesOf(sonarr, plex)).toEqual({ files: plex, changed: true, lost: false })
    expect(plexFilesOf(plex, plex)).toEqual({ files: plex, changed: false, lost: false })
  })

  it('loses a file Plex had seen, and drops one read from Sonarr without a loss', () => {
    expect(plexFilesOf(plex, [])).toEqual({ files: [], changed: true, lost: true })
    expect(plexFilesOf(sonarr, [])).toEqual({ files: [], changed: true, lost: false })
    expect(plexFilesOf(undefined, [])).toEqual({ files: [], changed: false, lost: false })
  })

  it('keeps a file linked by the import until Plex has scanned it', () => {
    expect(plexFilesOf(imported, [])).toEqual({ files: imported, changed: false, lost: false })
    expect(plexFilesOf([...plex, ...imported], [])).toEqual({ files: imported, changed: true, lost: false })
  })
})

describe('isImportable', () => {
  const torrent = { name: 'Show.S01E01.mkv', files: [{ path: 'Show.S01E01.mkv', size: 10 }] }

  it('imports an accepted release whose .torrent was read, once', () => {
    expect(isImportable({ torrent, accepted_at: now })).toBe(true)
    expect(isImportable({ torrent })).toBe(true)
    expect(isImportable({ torrent, imported_at: now })).toBe(false)
  })

  it('leaves a pending proposal and a release without its files', () => {
    expect(isImportable({ torrent, proposal: true })).toBe(false)
    expect(isImportable({ accepted_at: now })).toBe(false)
    expect(isImportable({ torrent: { name: 'Show', files: [] } })).toBe(false)
  })
})

describe('isReleaseOverdue', () => {
  it('marks an accepted release overdue a week after it was accepted', () => {
    expect(isReleaseOverdue({ accepted_at: now - OVERDUE_AFTER - 1 }, now)).toBe(true)
    expect(isReleaseOverdue({ accepted_at: now - OVERDUE_AFTER }, now)).toBe(false)
  })

  it('never marks a release without an acceptance date', () => {
    expect(isReleaseOverdue({}, now)).toBe(false)
  })
})

describe('showReleaseOf', () => {
  const release = { id: 'guid', title: 'Friends.S03E05.1080p.WEB-GRP', original: 'Friends.S03E05.1080p.WEB-GRP', znab: 'C411', link: 'l', enclosure: 'e', size: 1, coverage: [{ season: 3, episode: 5 }], valid: true, score: 3 }

  it('accepts a release downloaded without a proposal when it is downloaded, so it can turn overdue', () => {
    const raw = showReleaseOf(release, { from: 'record', job: 'j', proposal: false, level: 'episode' }, now)

    expect(raw).toEqual({ id: 'guid', title: release.title, original: release.original, from: 'record', job: 'j', proposal: false, znab: 'C411', link: 'l', enclosure: 'e', size: 1, coverage: release.coverage, level: 'episode', accepted_at: now })
    expect(isReleaseOverdue(raw, now + OVERDUE_AFTER + 1)).toBe(true)
  })

  it('keeps a swap marked as one', () => {
    expect(showReleaseOf({ ...release, swap: true }, { from: 'record', job: 'j', proposal: true, level: 'season' }, now).swap).toBe(true)
    expect(showReleaseOf(release, { from: 'record', job: 'j', proposal: true, level: 'episode' }, now)).not.toHaveProperty('swap')
  })

  it('leaves the acceptance of a proposal to its Accept', () => {
    expect(showReleaseOf(release, { from: 'airing', job: 'j', proposal: true, level: 'episode' }, now)).not.toHaveProperty('accepted_at')
  })
})

describe('isReleaseFinished', () => {
  const release = { torrent: { name: 'Show.S01', files: [{ path: 'Show.S01/Show.S01E01.mkv', size: 10 }, { path: 'Show.S01/Show.S01E02.mkv', size: 20 }] } }

  it('finishes a release once every file is there at its full size', () => {
    expect(isReleaseFinished(release, { 'Show.S01/Show.S01E01.mkv': 10, 'Show.S01/Show.S01E02.mkv': 20 })).toBe(true)
  })

  it('waits for a missing file, or one smaller than announced', () => {
    expect(isReleaseFinished(release, { 'Show.S01/Show.S01E01.mkv': 10 })).toBe(false)
    expect(isReleaseFinished(release, { 'Show.S01/Show.S01E01.mkv': 10, 'Show.S01/Show.S01E02.mkv': 19 })).toBe(false)
  })

  it('waits for a file qBittorrent still writes', () => {
    expect(isReleaseFinished(release, { 'Show.S01/Show.S01E01.mkv': 10, 'Show.S01/Show.S01E02.mkv.!qB': 20 })).toBe(false)
    expect(isReleaseFinished(release, { 'Show.S01/Show.S01E01.mkv': 10, 'Show.S01/Show.S01E02.mkv': 20, 'Show.S01/Show.S01E02.mkv.!qB': 20 })).toBe(false)
  })
})

describe('importTargetOf', () => {
  it('names the show folder after its name and first air year', () => {
    expect(importTargetOf('/tvshows', { name: 'Breaking Bad', first_air_date: '2008-01-20T00:00:00.000Z' }, 5, 'Breaking.Bad.S05/Breaking.Bad.S05E14.mkv')).toBe('/tvshows/Breaking Bad (2008)/Season 05/Breaking.Bad.S05E14.mkv')
  })

  it('keeps the folder the show already has', () => {
    expect(importTargetOf('/tvshows', { name: 'Friends', first_air_date: '1994-09-22', path: 'Friends' }, 10, 'Friends.S10E17.mkv')).toBe('/tvshows/Friends/Season 10/Friends.S10E17.mkv')
  })

  it('drops what a folder name cannot hold', () => {
    expect(showFolderOf({ name: 'Law & Order: Special Victims Unit', first_air_date: '1999-09-20' })).toBe('Law & Order Special Victims Unit (1999)')
    expect(showFolderOf({ name: 'Untitled' })).toBe('Untitled')
  })
})

describe('importLinksOf', () => {
  const show = { name: 'The Office', first_air_date: '2005-03-24' }
  const episodes = [
    { season_number: 3, episode_number: 23, files: [{ id: '1' }] },
    { season_number: 3, episode_number: 24, files: [] },
    { season_number: 3, episode_number: 25 },
    { season_number: 4, episode_number: 1, files: [] },
  ]
  const release = {
    coverage: [{ season: 3, episode: 23 }, { season: 3, episode: 24 }, { season: 3, episode: 25 }],
    torrent: {
      name: 'The.Office.US.S03',
      files: [
        { path: 'The.Office.US.S03/The.Office.US.S03E23.mkv', size: 1 },
        { path: 'The.Office.US.S03/The.Office.US.S03E24E25.mkv', size: 2 },
        { path: 'The.Office.US.S03/The.Office.US.S04E01.mkv', size: 3 },
        { path: 'The.Office.US.S03/Sample/The.Office.US.S03E24E25.sample.mkv', size: 4 },
        { path: 'The.Office.US.S03/The.Office.US.S03.nfo', size: 5 },
      ],
    },
  }

  it('links each file to the covered episodes without files it holds', () => {
    expect(importLinksOf(release, show, episodes, '/tvshows')).toEqual([
      { source: 'The.Office.US.S03/The.Office.US.S03E24E25.mkv', target: '/tvshows/The Office (2005)/Season 03/The.Office.US.S03E24E25.mkv', season: 3, episodes: [24, 25], size: 2 },
    ])
  })

  it('links every episode of a swap, the ones with files included', () => {
    expect(importLinksOf({ ...release, swap: true }, show, episodes, '/tvshows').map(({ source, episodes }) => [source, episodes])).toEqual([
      ['The.Office.US.S03/The.Office.US.S03E23.mkv', [23]],
      ['The.Office.US.S03/The.Office.US.S03E24E25.mkv', [24, 25]],
    ])
  })

  it('links nothing for a release covering episodes that all have files', () => {
    expect(importLinksOf(release, show, episodes.map((episode) => ({ ...episode, files: [{ id: '1' }] })), '/tvshows')).toEqual([])
  })

  it('links only a video, never an executable, an archive or a text file named after the episode', () => {
    const files = ['exe', 'lnk', 'rar', 'r00', 'nfo', 'MKV'].map((extension, index) => ({ path: `The.Office.US.S03E24.${extension}`, size: index }))

    expect(importLinksOf({ ...release, torrent: { name: 'The.Office.US.S03E24', files } }, show, episodes, '/tvshows').map(({ source }) => source)).toEqual(['The.Office.US.S03E24.MKV'])
  })

  it('links a subtitle next to the video it numbers the same, and no other', () => {
    const files = [
      { path: 'The.Office.US.S03/The.Office.US.S03E24E25.mkv', size: 2 },
      ...['srt', 'ass', 'ssa', 'sub', 'idx', 'VTT'].map((extension) => ({ path: `The.Office.US.S03/Subs/The.Office.US.S03E24.FRENCH.${extension}`, size: 1 })),
      { path: 'The.Office.US.S03/The.Office.US.S03E23.srt', size: 1 },
      { path: 'The.Office.US.S03/Subs/2_English.srt', size: 1 },
    ]
    const links = importLinksOf({ ...release, torrent: { name: 'The.Office.US.S03', files } }, show, episodes, '/tvshows')

    expect(links.map(({ source }) => source)).toEqual(files.slice(0, 7).map(({ path }) => path))
    expect(links[1]).toEqual({ source: 'The.Office.US.S03/Subs/The.Office.US.S03E24.FRENCH.srt', target: '/tvshows/The Office (2005)/Season 03/The.Office.US.S03E24.FRENCH.srt', season: 3, episodes: [], size: 1 })
    expect(importedEpisodesOf(release, episodes.map((episode, index) => ({ ...episode, id: index })), links).owned.map(({ files }) => files.map(({ id }) => id))).toEqual([
      ['import:The.Office.US.S03/The.Office.US.S03E24E25.mkv'],
      ['import:The.Office.US.S03/The.Office.US.S03E24E25.mkv'],
    ])
  })
})

describe('importedEpisodesOf', () => {
  const release = { id: 'r', coverage: [{ season: 3, episode: 23 }, { season: 3, episode: 24 }, { season: 3, episode: 25 }] }
  const episodes = [
    { id: 23, season_number: 3, episode_number: 23, files: [], release: 'r' },
    { id: 24, season_number: 3, episode_number: 24, files: [], release: 'r' },
    { id: 25, season_number: 3, episode_number: 25, files: [], release: 'r' },
    { id: 26, season_number: 3, episode_number: 26, files: [], release: 'other' },
  ]
  const link = { source: 'The.Office.US.S03/The.Office.US.S03E24E25.1080p.WEB.x264-GRP.mkv', target: '/tvshows/The Office (2005)/Season 03/The.Office.US.S03E24E25.1080p.WEB.x264-GRP.mkv', season: 3, episodes: [24, 25], size: 2 }

  it('gives each linked episode its file, marked as coming from the import', () => {
    const { owned } = importedEpisodesOf(release, episodes, [link])

    expect(owned.map(({ id }) => id)).toEqual([24, 25])
    expect(owned[0].files).toEqual([{ id: `import:${link.source}`, size: 2, title: 'The.Office.Us.S03E24-E25.1080p.WEB-DL.x264-GRP', original: 'The.Office.US.S03E24E25.1080p.WEB.x264-GRP', from: 'import' }])
    expect(owned[1].files).toEqual(owned[0].files)
  })

  it('adds the linked file next to the ones an episode of a swap already has', () => {
    const plex = { id: 'plex://episode/3-24#1', size: 1, from: 'sync' }
    const { owned } = importedEpisodesOf({ ...release, swap: true }, episodes.map((episode) => episode.id === 24 ? { ...episode, files: [plex] } : episode), [link])

    expect(owned[0].files.map(({ id }) => id)).toEqual([plex.id, `import:${link.source}`])
  })

  it('lets go a covered episode of the release left without a file, and nothing else', () => {
    expect(importedEpisodesOf(release, episodes, [link]).unlinked.map(({ id }) => id)).toEqual([23])
    expect(importedEpisodesOf(release, episodes, []).unlinked.map(({ id }) => id)).toEqual([23, 24, 25])
    expect(importedEpisodesOf(release, episodes.map((episode) => ({ ...episode, files: [{ id: 'plex' }] })), []).unlinked).toEqual([])
  })
})

describe('requestedShowOf', () => {
  const fetched = {
    show: { id: 1668, name: 'Friends', status: 'Ended' },
    episodes: [
      { id: 1, show_id: 1668, season_number: 0, episode_number: 1 },
      { id: 2, show_id: 1668, season_number: 1, episode_number: 1 },
    ],
  }

  it('brings a requested show in ignored and unmonitored, every episode unmonitored, with the guests requesting it', () => {
    const { show, episodes } = requestedShowOf(fetched, 'plex://show/5d9c086c46115600200aa2fe', ['guest@example.com'])

    expect(show).toEqual({
      id: 1668,
      name: 'Friends',
      status: 'Ended',
      state: 'ignored',
      monitored: false,
      monitor_new_seasons: false,
      plex_guid: 'plex://show/5d9c086c46115600200aa2fe',
      requested_by: ['guest@example.com'],
    })
    expect(episodes.map(({ id, monitored }) => [id, monitored])).toEqual([[1, false], [2, false]])
  })
})

describe('proposalOnlyOf', () => {
  it('follows the show when it says, the job otherwise', () => {
    expect(proposalOnlyOf({ proposal_only: false }, true)).toBe(false)
    expect(proposalOnlyOf({ proposal_only: true }, false)).toBe(true)
    expect(proposalOnlyOf({ proposal_only: null }, true)).toBe(true)
    expect(proposalOnlyOf({}, false)).toBe(false)
    expect(proposalOnlyOf({}, undefined)).toBe(false)
  })
})

describe('airingUnits', () => {
  const since = new Date('2026-09-17T12:00:00Z').getTime()
  const episodes = [
    { season_number: 3, episode_number: 1, air_date: '2026-09-10' },
    { season_number: 3, episode_number: 2, air_date: '2026-09-18' },
    { season_number: 3, episode_number: 3, air_date: '2026-09-24' },
    { season_number: 3, episode_number: 4, air_date: null },
  ]
  const units = [
    { type: 'season', season: 3, episodes: [] },
    ...[1, 2, 3, 4].map((episode) => ({ type: 'episode', season: 3, episode, episodes: [{ season: 3, episode }] })),
  ]

  it('keeps the single episodes aired since the given date, and no pack', () => {
    expect(airingUnits(units, episodes, since).map(({ type, episode }) => `${type}:${episode}`)).toEqual(['episode:2', 'episode:3'])
  })
})

describe('goneEpisodesOf', () => {
  const episode = (id, season_number, fields = {}) => ({ id, season_number, monitored: true, files: [], release: null, ...fields })
  const seasons = [{ season_number: 1 }, { season_number: 2 }]

  it('deletes an episode TMDB dropped from a season it answered for, and unfollows one holding a file or a release', () => {
    const known = [episode(1, 1), episode(2, 1), episode(3, 1, { files: [{ id: 'plex://episode/3#1' }] }), episode(4, 1, { release: 'abc' }), episode(5, 1, { release: 'def', monitored: false })]

    expect(goneEpisodesOf(known, [episode(1, 1)], seasons)).toEqual({ removed: [2], unfollowed: [3, 4] })
  })

  it('leaves the episodes of a season TMDB lists but did not answer for, and drops those of a season it no longer lists', () => {
    const known = [episode(1, 1), episode(2, 2), episode(3, 3)]

    expect(goneEpisodesOf(known, [episode(1, 1)], seasons)).toEqual({ removed: [3], unfollowed: [] })
  })
})
