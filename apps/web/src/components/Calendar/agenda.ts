const pad = (number) => String(number).padStart(2, '0')

// A calendar day, read in local time as TMDB dates carry no time
export const day = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

export const dateOf = (key: string) => new Date(`${key}T00:00:00`)

// The first and the last day of the month of a date
export const monthRange = (date: Date) => [
  day(new Date(date.getFullYear(), date.getMonth(), 1)),
  day(new Date(date.getFullYear(), date.getMonth() + 1, 0)),
] as const

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

// Where a list opens on a month: on today in the current month, on its first day otherwise
export const originOf = (month: Date | null | undefined, today: string) => (
  (!(month instanceof Date) || day(month).slice(0, 7) === today.slice(0, 7)) ? today : monthRange(month)[0]
)

// A list reads two streams out from its origin, the past before it and the future from it. Today is kept as a
// marker, even when nothing happens on it, once what both streams loaded reaches it.
export const withToday = <T extends { key: string, date: Date, entries: any[] }>(
  days: T[],
  today: string,
  origin: string,
  { past, future }: { past: { done: boolean }, future: { done: boolean } },
): T[] => {
  if (days.some(({ key }) => key === today)) {
    return days
  }

  const low = past.done ? '' : [days[0]?.key, origin].filter(Boolean).sort()[0]
  const high = future.done ? '￿' : [days[days.length - 1]?.key, origin].filter(Boolean).sort().pop()

  return (today < low || today > high)
    ? days
    : [...days, { key: today, date: dateOf(today), entries: [] } as T].sort((a, b) => a.key.localeCompare(b.key))
}
