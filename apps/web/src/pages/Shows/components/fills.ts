import oleoo from 'oleoo'

const pad = (number: number) => String(number).padStart(2, '0')

const SHOWN = 6

type Episode = { season_number: number, episode_number: number, files?: any[] }

// A release's `coverage` lists the wanted episodes it brings, its pack holds more: every episode of its
// seasons, of the whole show for a series. Told as `E02 E04`, or `S03E02` when it spans several seasons
export const fillsOf = (
  coverage: { season: number, episode: number }[],
  episodes: Episode[],
  level?: 'series' | 'season' | 'episode',
) => {
  const owned = new Set(episodes
    .filter(({ files }) => files?.length)
    .map(({ season_number, episode_number }) => `${season_number}:${episode_number}`))
  const missing = [...coverage]
    .sort((a, b) => (a.season - b.season) || (a.episode - b.episode))
    .filter(({ season, episode }) => !owned.has(`${season}:${episode}`))
  const seasons = new Set(coverage.map(({ season }) => season))
  const pack = level === 'series' ? episodes.filter(({ season_number }) => season_number !== 0).length
    : level === 'season' ? episodes.filter(({ season_number }) => seasons.has(season_number)).length
    : 0
  const codes = missing.map(({ season, episode }) => `${seasons.size > 1 ? `S${pad(season)}` : ''}E${pad(episode)}`)

  return {
    total: Math.max(pack, coverage.length),
    missing,
    codes,
    label: [...codes.slice(0, SHOWN), ...(codes.length > SHOWN ? [`+${codes.length - SHOWN}`] : [])].join(' '),
  }
}

// oleoo names a file MULTi whenever it reads two languages, even two that disagree: `VOST-FR-EN` reads as
// VOSTFR and as FR-EN. Only a single language, or a MULTi the name spells out without a VOST, is kept
export const fileMetaOf = (file: { title?: string, original?: string }) => {
  const meta = oleoo.parse(file?.original || file?.title || '', { strict: false, flagged: true })
  const languages = meta.languages || []
  const read = languages.length <= 1 || (languages.includes('MULTi') && !languages.some(language => language.startsWith('VOST')))

  return read ? meta : { ...meta, language: null }
}

// A file holding several episodes sits on each of them, it is listed once
const filesOf = (episodes: Episode[]) => [...new Map(episodes.flatMap(({ files }) => files || []).map(file => [file.id, file])).values()]

export const sizeOf = (episodes: Episode[]) => filesOf(episodes).reduce((sum, file) => sum + (file.size || 0), 0)

// The files a release is weighed against: those of the seasons it covers, else any the show has
export const ownedFilesOf = (
  release: { coverage?: { season: number }[], level?: string },
  episodes: Episode[],
) => {
  const seasons = new Set((release.coverage || []).map(({ season }) => season))
  const scoped = filesOf(episodes.filter(({ season_number }) => release.level === 'series' ? season_number !== 0 : seasons.has(season_number)))

  return scoped.length ? scoped : filesOf(episodes)
}
