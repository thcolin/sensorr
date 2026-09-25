const pad = (number: number) => String(number).padStart(2, '0')

const SHOWN = 6

// A release's `coverage` lists the wanted episodes it brings, its pack holds more: every episode of its
// seasons, of the whole show for a series. Told as `E02 E04`, or `S03E02` when it spans several seasons
export const fillsOf = (
  coverage: { season: number, episode: number }[],
  episodes: { season_number: number, episode_number: number, files?: any[] }[],
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
