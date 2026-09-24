const pad = (number) => String(number).padStart(2, '0')

// A calendar day, read in local time as TMDB dates carry no time
export const day = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

export const monthRange = (date: Date) => ({
  aired_after: day(new Date(date.getFullYear(), date.getMonth(), 1)),
  aired_before: day(new Date(date.getFullYear(), date.getMonth() + 1, 0)),
})

export const groupByDay = (episodes: any[], shows: { [id: string]: { name?: string } }) => Object.entries<any[]>(
  episodes
    .filter(episode => !!episode?.air_date)
    .reduce((acc: { [key: string]: any[] }, episode) => {
      const key = new Date(episode.air_date).toISOString().slice(0, 10)
      return { ...acc, [key]: [...(acc[key] || []), episode] }
    }, {})
)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([key, episodes]) => ({
    key,
    date: new Date(`${key}T00:00:00`),
    episodes: episodes.sort((a, b) => (
      (shows[a.show_id]?.name || '').localeCompare(shows[b.show_id]?.name || '') ||
      (a.season_number - b.season_number) ||
      (a.episode_number - b.episode_number)
    )),
  }))
