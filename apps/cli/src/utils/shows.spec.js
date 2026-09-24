import { isRefreshDue, monitoredOf, sonarrShowOf, sonarrEpisodesOf, REFRESH_AFTER, isImportable, isReleaseFinished, showFolderOf, importTargetOf, importLinksOf, requestedShowOf, proposalOnlyOf, airingUnits, syncedFilesOf } from './shows'

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
      { source: 'The.Office.US.S03/The.Office.US.S03E24E25.mkv', target: '/tvshows/The Office (2005)/Season 03/The.Office.US.S03E24E25.mkv', season: 3, episodes: [24, 25] },
    ])
  })

  it('links nothing for a release covering episodes that all have files', () => {
    expect(importLinksOf(release, show, episodes.map((episode) => ({ ...episode, files: [{ id: '1' }] })), '/tvshows')).toEqual([])
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
