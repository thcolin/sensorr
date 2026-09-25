import { episodeStatus } from '@sensorr/sensorr'

const pad = (number) => String(number).padStart(2, '0')

// A calendar day, read in local time as TMDB dates carry no time
export const day = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

// The day an episode airs on: the API stores a TMDB date as midnight UTC
export const airDay = (episode: { air_date: string | Date }) => new Date(episode.air_date).toISOString().slice(0, 10)

// The weeks a month grid shows, Monday first, with the days of the months around it
export const monthWeeks = (date: Date) => {
  const first = new Date(date.getFullYear(), date.getMonth(), 1)
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  const lead = (first.getDay() + 6) % 7
  const length = Math.ceil((lead + last.getDate()) / 7) * 7

  return Array.from({ length: length / 7 }, (_, week) => Array.from({ length: 7 }, (_, weekday) => {
    const date = new Date(first.getFullYear(), first.getMonth(), 1 - lead + (week * 7) + weekday)
    return { key: day(date), date, outside: date.getMonth() !== first.getMonth() }
  }))
}

export const weeksRange = (date: Date) => {
  const weeks = monthWeeks(date)

  return {
    aired_after: weeks[0][0].key,
    aired_before: weeks[weeks.length - 1][6].key,
  }
}

export const groupByDay = (episodes: any[], shows: { [id: string]: { name?: string } }, now: Date | number = Date.now()) => [
  ...episodes
    .filter(episode => !!episode?.air_date)
    .reduce((acc, episode) => {
      const key = airDay(episode)
      return acc.set(key, [...(acc.get(key) || []), episode])
    }, new Map<string, any[]>())
    .entries(),
]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([key, episodes]) => ({
    key,
    date: new Date(`${key}T00:00:00`),
    entries: episodes
      .sort((a, b) => (
        (shows[a.show_id]?.name || '').localeCompare(shows[b.show_id]?.name || '') ||
        (a.show_id - b.show_id) ||
        (a.season_number - b.season_number) ||
        (a.episode_number - b.episode_number)
      ))
      .reduce((entries: { show_id: number, status: string, episodes: any[] }[], episode) => {
        const status = episodeStatus(episode, now)
        const last = entries[entries.length - 1]

        return (last && last.show_id === episode.show_id && last.status === status)
          ? [...entries.slice(0, -1), { ...last, episodes: [...last.episodes, episode] }]
          : [...entries, { show_id: episode.show_id, status, episodes: [episode] }]
      }, []),
  }))

// The days of the agenda, from what its two streams loaded: `past` walks back from yesterday, newest first, and
// `future` forward from today. The farthest day of a stream with pages left can be cut by its page, so it waits
// for the next one. Today stays, even when nothing airs.
export const agendaDays = (
  { past, future }: { past: { episodes: any[], done: boolean }, future: { episodes: any[], done: boolean } },
  shows: { [id: string]: { name?: string } },
  today: string,
  now: Date | number = Date.now(),
) => {
  const cut = [past, future]
    .filter(({ episodes, done }) => !done && episodes.length)
    .map(({ episodes }) => airDay(episodes[episodes.length - 1]))

  const days = groupByDay([...new Map([...past.episodes, ...future.episodes].map(episode => [episode.id, episode])).values()], shows, now)
    .filter(({ key }) => !cut.includes(key))

  return days.some(({ key }) => key === today)
    ? days
    : [...days, { key: today, date: new Date(`${today}T00:00:00`), entries: [] }].sort((a, b) => a.key.localeCompare(b.key))
}
