import { episodeStatus } from '@sensorr/sensorr'
import { monthWeeks, withToday } from '../../components/Calendar/agenda'

export { day } from '../../components/Calendar/agenda'

// The day an episode airs on: the API stores a TMDB date as midnight UTC
export const airDay = (episode: { air_date: string | Date }) => new Date(episode.air_date).toISOString().slice(0, 10)

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

// The days of the list, from what its two streams loaded: `past` walks back from the day before the origin, newest
// first, and `future` forward from it. The farthest day of a stream with pages left can be cut by its page, so it
// waits for the next one.
export const agendaDays = (
  { past, future }: { past: { items: any[], done: boolean }, future: { items: any[], done: boolean } },
  shows: { [id: string]: { name?: string } },
  today: string,
  origin: string,
  now: Date | number = Date.now(),
) => {
  const cut = [past, future]
    .filter(({ items, done }) => !done && items.length)
    .map(({ items }) => airDay(items[items.length - 1]))

  const days = groupByDay([...new Map([...past.items, ...future.items].map(episode => [episode.id, episode])).values()], shows, now)
    .filter(({ key }) => !cut.includes(key))

  return withToday(days, today, origin, { past, future })
}
