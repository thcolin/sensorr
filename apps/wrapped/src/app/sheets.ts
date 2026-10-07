import type { Wrapped, WrappedPoster } from '@sensorr/sensorr'
import i18n from '@sensorr/i18n/wrapped'
import type { Share } from './App'

// What each sheet says and shows, the same words whatever the look draws around them

export const TIME_ZONE = 'Europe/Paris'
// Under this many plays most sheets would be empty
const THRESHOLD = 10
// `wrapped.month_shows` runs from December of the previous year to November
export const months = () => Array.from({ length: 12 }, (_, index) => new Date(Date.UTC(2000, (index + 11) % 12, 15)).toLocaleDateString(i18n.language, { month: 'long', timeZone: 'UTC' }))

export const t = (key: string, values?: Record<string, unknown>) => i18n.t(key, values)
const french = () => i18n.language === 'fr'
export const number = { format: (value: number) => value.toLocaleString(i18n.language) }
const today = () => new Date().toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', timeZone: TIME_ZONE })
// A date of the edition, read at noon so no time zone moves it to the day before
export const dayOf = (date: string, weekday = false) => {
  const day = new Date(`${date}T12:00:00Z`).toLocaleDateString(i18n.language, { weekday: weekday ? 'long' : undefined, day: 'numeric', month: 'long', timeZone: TIME_ZONE })
  return french() ? day.replace(/(^|\s)1 /, '$11er ') : day
}
// « 23 h 05 », « 11:05 PM »
const clock = (time: string) => french()
  ? time.replace(/^0?(\d+):/, '$1 h ')
  : new Date(`2000-01-01T${time}:00Z`).toLocaleTimeString(i18n.language, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })
export const quoted = (title: string) => t('wrapped.format.quoted', { title })
const lasting = (minutes: number) => minutes < 60
  ? t('wrapped.format.minutes', { minutes })
  : t('wrapped.format.duration', { hours: Math.floor(minutes / 60), minutes: String(minutes % 60).padStart(2, '0') })
const rhythm = (perDay: number) => perDay >= 1.5 ? t('wrapped.rhythm.many', { count: Math.round(perDay) })
  : perDay >= 1 ? t('wrapped.rhythm.more')
    : perDay >= 0.8 ? t('wrapped.rhythm.almost')
      : t('wrapped.rhythm.every', { count: Math.round(1 / perDay) })
// « 3 épisodes et 1 film », « le 1er février et le 8 février »
const listOf = (items: string[]) => new Intl.ListFormat(i18n.language, { type: 'conjunction' }).format(items)
const linesOf = (key: string, values?: Record<string, unknown>) => t(key, values).split('\n')

// A quantity stands out with its unit: not a date, nor the digits of a name or of a title in quotes
const QUANTITIES = {
  fr: new RegExp(`(?<![\\p{L}\\d._])(S\\d+E\\d+|\\d+(?:\\s\\d{3})*(?:\\sh\\s\\d+|\\s?%)?)(?![\\p{L}\\d])(?!(?:er)?\\s(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre))(?:\\s(jours?\\sd’écart|films?\\set\\sséries|(?:soirs?|jours?|épisodes?|films?|séries?|titres?|fois|heures?|personnes?|spectateurs?)(?![\\p{L}])|par jour))?`, 'gu'),
  en: new RegExp(`(?<![\\p{L}\\d._,])(?<!(?:January|February|March|April|May|June|July|August|September|October|November|December)\\s)(S\\d+E\\d+|\\d+(?:,\\d{3})*(?:h\\s\\d+m|%)?)(?![\\p{L}\\d])(?:\\s(days?\\sapart|movies?\\s(?:and|or)\\sshows?|(?:nights?|days?|episodes?|movies?|shows?|titles?|times|hours?|people|person|viewers?)(?![\\p{L}])|a\\sday))?`, 'gu'),
}
export const quantity = () => QUANTITIES[french() ? 'fr' : 'en']
// A title in quotes: its digits are the title's own
export const QUOTED = /(«[^»]*»|“[^”]*”)/
// A figure and its unit, for a look that sets them apart from the sentence
export type Stat = { value: string, unit: string }
const paceStatsOf = ({ episodes, days }: { episodes: number, days: number }): Stat[] => {
  const perDay = episodes / days
  return [
    { value: number.format(episodes), unit: t('wrapped.units.episodes', { count: episodes }) },
    { value: number.format(days), unit: t('wrapped.units.days', { count: days }) },
    perDay >= 1 ? { value: number.format(Math.round(perDay * 10) / 10), unit: t('wrapped.units.perDay') } : { value: '1', unit: t('wrapped.units.every', { count: Math.round(1 / perDay) }) },
  ]
}
export const suffix = (rank: number) => t('wrapped.format.ordinal', { rank })
// S03E12
const episodeOf = (season: number, episode: number) => `S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`
// Minutes from one « HH:MM » to the next, past midnight included
const minutesBetween = (end: string, start: string) => {
  const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3))
  return (minutes(start) - minutes(end) + 1440) % 1440
}
// The plays of a night, the episodes of a show watched in a row on one line: « S01E01 à S01E05 »
const scheduleOf = (plays: NonNullable<NonNullable<Wrapped['night']>['schedule']>) => plays.reduce<{ start: string, end: string, poster: WrappedPoster, what: string | null, from?: string }[]>((lines, play) => {
  const code = play.season !== undefined && play.episode !== undefined ? episodeOf(play.season, play.episode) : null
  const last = lines[lines.length - 1]
  if (last && code && last.from && last.poster.key === play.key && minutesBetween(last.end, play.start) <= 30) {
    return [...lines.slice(0, -1), { ...last, end: play.end, what: t('wrapped.sheets.night.range', { from: last.from, to: code }) }]
  }
  const { start, end, season, episode, ...poster } = play
  return [...lines, { start, end, poster, what: code, from: code || undefined }]
}, []).map(({ from, ...line }) => line)

// Between one evening and the other viewer's
const gapOf = (days?: number) => days === undefined ? null : t('wrapped.sheets.duo.gap', { days })

// A poster with what it stands for: a label above its title, a detail under it, and when it was watched
export type Billed = { what: string, poster: WrappedPoster, detail: string, when?: string | null }
// « Vu le 3 mars », « Vu le 1er février et le 8 février »
const seen = (dates?: string[]) => dates?.length ? t('wrapped.sheets.outliers.seen', { dates: listOf(dates.map((date) => t('wrapped.sheets.outliers.on', { date: dayOf(date) }))) }) : null

export type SheetModel =
  | { kind: 'opening', label: string, title: string, name: string, year: number, lede: string | null, first: string | null, figures: string[], posters: WrappedPoster[] }
  | { kind: 'rank', label: string, rank: number, suffix: string, users: number, unit: string, detail: string, hours: number, median: number, max: number | null, compare: string }
  | { kind: 'streak', label: string, evenings: number, poster: WrappedPoster, intro: string, unit: string, spoken: string, details: string, span: string, lead: boolean, from: string, to: string, nights: { day: string, short: string, poster: WrappedPoster | null }[] }
  | { kind: 'months', label: string, lines: string[], lede: string, shows: Wrapped['month_shows'], elapsed: number, max: number, alt: string, peak: { month: string, index: number, show: WrappedPoster & { episodes: number }, text: string, bare: string } | null }
  | { kind: 'binge', label: string, lines: string[], poster: WrappedPoster, title: string, meta: string[], paced: string | null, date: string | null, stats: Stat[], paced_stats: Stat[], episodes: number | null, pace: (WrappedPoster & { episodes: number, days: number }) | null }
  | { kind: 'night', label: string, late: boolean, lines: string[], poster: WrappedPoster, date: string, end: string, after: string, last: string, listing: string | null, schedule: { start: string, end: string, poster: WrappedPoster, what: string | null }[] }
  | { kind: 'server', label: string, first: boolean, lines: string[], poster: WrappedPoster, title: string, lede: string, bare: string }
  | { kind: 'figure', label: string, variant: 'only_you' | 'twin', lines: string[] | null, count: number, spoken: string, unit: string, highlight?: string, details: string, posters: WrappedPoster[], sides?: { you: number, them: number | null } }
  | { kind: 'duo', label: string, lines: string[], lede: string, posters: (WrappedPoster & { caption: string, who: string, gap: string | null })[] }
  | { kind: 'posters', label: string, variant: 'dropped' | 'outliers', lines: string[], items: Billed[] }
  | { kind: 'genre', label: string, lines: string[], name: string, count: string, posters: WrappedPoster[], lead: { name: string, role: string, posters: WrappedPoster[] } | null }
  | { kind: 'finale', label: string, lines: string[], poster: WrappedPoster, title: string, date: string, closed: boolean, end: string }

export type Colophon = { short: string | null, text: string }

// A poster standing for two figures shows once with both
const bill = (items: (Billed | null | false)[]) => (items.filter(Boolean) as Billed[]).reduce<Billed[]>((all, item) => {
  const same = all.find((other) => other.poster.key === item.poster.key)
  return same
    ? all.map((entry) => entry === same ? { what: t('wrapped.format.both', { first: same.what, second: item.what.toLowerCase() }), poster: item.poster, detail: `${same.detail}, ${item.detail}`, when: same.when || item.when } : entry)
    : [...all, item]
}, [])

export const sheetsOf = (share: Share) => {
  const { name, year, frozen, wrapped } = share
  const place = share.server || t('wrapped.format.place')
  const nameOf = (user_id: number) => share.names[user_id] || t('wrapped.format.someone')
  const short = wrapped.plays < THRESHOLD
  // 1 December at midnight in Paris: until the job freezes the edition, it is still closed
  const closed = frozen || Date.now() >= Date.UTC(year, 10, 30, 23)
  const { first, previous, first_on_server, same_week, only_you, dropped, dropped_show, longest, oldest, rewatched, streak, binge, pace, night, duo, twin, genre, last } = wrapped
  const sheets: SheetModel[] = []
  const names = months()

  const collage = [
    first, streak?.poster, binge, night?.poster, first_on_server || same_week,
    only_you?.posters[0], longest, oldest, last, ...wrapped.month_shows,
  ].filter((item, index, items): item is WrappedPoster => !!item?.thumb && items.findIndex((other) => other?.key === item.key) === index).slice(0, 5)

  sheets.push({
    kind: 'opening',
    label: t('wrapped.sheets.opening.label'),
    title: t('wrapped.title', { name, year }),
    name,
    year,
    lede: first ? t('wrapped.sheets.opening.lede', { place, date: dayOf(first.date), title: quoted(first.title) }) : null,
    // The key of the first title of the year, when it is among the posters
    first: first?.key ?? null,
    figures: [
      t('wrapped.sheets.opening.total', { hours: wrapped.hours, evenings: wrapped.evenings }),
      wrapped.movies && t('wrapped.count.movies', { count: wrapped.movies }),
      wrapped.shows && t('wrapped.sheets.opening.shows', { shows: wrapped.shows, episodes: wrapped.episodes }),
      previous && t(closed ? 'wrapped.sheets.opening.previous.closed' : 'wrapped.sheets.opening.previous.open', { hours: previous.hours }),
    ].filter(Boolean) as string[],
    posters: collage,
  })

  if (wrapped.rank > 0) {
    const { rank } = wrapped
    sheets.push({
      kind: 'rank',
      label: t('wrapped.sheets.rank.label'),
      rank,
      suffix: suffix(rank),
      users: wrapped.server.users,
      unit: t('wrapped.sheets.rank.unit', { users: wrapped.server.users }),
      detail: t('wrapped.sheets.rank.detail', { ahead: rank - 1, few: rank <= 11, place }),
      hours: wrapped.hours,
      median: wrapped.server.median_hours,
      // An edition frozen before the first viewer's hours were kept does not know them
      max: wrapped.server.max_hours ?? null,
      compare: t('wrapped.sheets.rank.compare', { hours: wrapped.hours, median: wrapped.server.median_hours }),
    })
  }

  if (!short && streak) {
    sheets.push({
      kind: 'streak',
      label: t('wrapped.sheets.streak.label'),
      evenings: streak.evenings,
      poster: streak.poster,
      intro: t('wrapped.sheets.streak.intro'),
      unit: t('wrapped.sheets.streak.unit'),
      spoken: t('wrapped.count.evenings', { count: streak.evenings }),
      details: t('wrapped.sheets.streak.details', {
        from: dayOf(streak.from),
        to: dayOf(streak.to),
        mode: streak.times === undefined ? 'often' : streak.times > 1 ? 'some' : 'other',
        times: streak.times,
        title: quoted(streak.poster.title),
      }),
      // The poster stands for the run only when it came back on more than one evening
      // The same, under the title it names
      span: t('wrapped.sheets.streak.span', { from: dayOf(streak.from), to: dayOf(streak.to), some: !!streak.times && streak.times > 1, times: streak.times, evenings: streak.evenings }),
      lead: streak.times === undefined || streak.times > 1,
      from: streak.from,
      to: streak.to,
      // An edition frozen before the titles of each evening were kept only has its dates
      nights: Array.from({ length: streak.evenings }, (_, index) => {
        const date = new Date(Date.parse(`${streak.from}T12:00:00Z`) + index * 86400000)
        return {
          day: dayOf(date.toISOString().slice(0, 10), true),
          // « lundi 3 », the day without its month
          short: t('wrapped.sheets.streak.night', { weekday: date.toLocaleDateString(i18n.language, { weekday: 'long', timeZone: TIME_ZONE }), day: date.toLocaleDateString(i18n.language, { day: 'numeric', timeZone: TIME_ZONE }) }),
          poster: streak.nights?.[index] || null,
        }
      }),
    })
  }

  if (!short && wrapped.month_shows.some(Boolean)) {
    const shows = wrapped.month_shows
    const month = new Date().toLocaleDateString('en-US', { month: 'numeric', timeZone: TIME_ZONE })
    const elapsed = closed ? 12 : (Number(month) % 12) + 1
    const episodes = shows.map((show) => show?.episodes || 0)
    const peak = episodes.indexOf(Math.max(...episodes))
    const show = shows[peak]
    sheets.push({
      kind: 'months',
      label: t('wrapped.sheets.months.label'),
      lines: linesOf('wrapped.sheets.months.lines'),
      lede: t('wrapped.sheets.months.lede'),
      shows,
      elapsed,
      max: Math.max(...episodes, 1),
      alt: shows.slice(0, elapsed).map((show, index) => show
        ? t('wrapped.sheets.months.alt.show', { month: names[index], title: show.title, episodes: show.episodes })
        : t('wrapped.sheets.months.alt.none', { month: names[index] })).join(', '),
      peak: show ? { month: names[peak], index: peak, show, text: t('wrapped.sheets.months.peak.text', { title: quoted(show.title), episodes: show.episodes }), bare: `${t('wrapped.count.episodes', { count: show.episodes })}.` } : null,
    })
  }

  if (!short && (binge || pace)) {
    const lead = (binge || pace)!
    const paced = pace && t('wrapped.sheets.binge.paced', { episodes: pace.episodes, days: pace.days, rhythm: rhythm(pace.episodes / pace.days) })
    sheets.push({
      kind: 'binge',
      label: t('wrapped.sheets.binge.label'),
      lines: binge ? linesOf('wrapped.sheets.binge.lines', { count: binge.episodes }) : [t('wrapped.sheets.binge.pace')],
      poster: lead,
      title: lead.title,
      // Episodes watched in the binge evening, none when only the pace is known
      episodes: binge?.episodes ?? null,
      // The show of the pace line, when it is not the binge's own and wants its own poster
      pace: pace && pace.key !== lead.key ? pace : null,
      date: binge && t('wrapped.sheets.binge.date', { date: dayOf(binge.date, true) }),
      stats: [...(binge ? [{ value: lasting(binge.minutes), unit: t('wrapped.sheets.binge.straight') }] : []), ...(pace && pace.key === lead.key ? paceStatsOf(pace) : [])],
      paced_stats: pace && pace.key !== lead.key ? paceStatsOf(pace) : [],
      // The pace line, under the title of its show
      paced,
      meta: [
        binge && t('wrapped.sheets.binge.evening', { date: dayOf(binge.date, true), duration: lasting(binge.minutes) }),
        pace && (pace.key === lead.key ? t('wrapped.sheets.binge.total', { paced }) : t('wrapped.sheets.binge.also', { title: quoted(pace.title), paced })),
      ].filter(Boolean) as string[],
    })
  }

  // An early evening that is the binge's own evening would tell it twice
  if (!short && night && (night.late || night.date !== binge?.date)) {
    const { poster, late } = night
    const when = late ? 'late' : 'evening'
    sheets.push({
      kind: 'night',
      label: t(`wrapped.sheets.night.label.${when}`),
      late,
      lines: linesOf(`wrapped.sheets.night.lines.${when}`),
      poster,
      date: late ? t('wrapped.sheets.night.late', { date: dayOf(night.date, true) }) : dayOf(night.date, true),
      end: clock(night.end),
      after: night.plays > 1 ? t('wrapped.sheets.night.after', {
        plays: listOf([
          night.episodes && t('wrapped.count.episodes', { count: night.episodes }),
          night.plays - night.episodes && t('wrapped.count.movies', { count: night.plays - night.episodes }),
        ].filter(Boolean) as string[]),
      }) : '',
      last: t(night.plays > 1 ? 'wrapped.sheets.night.last' : 'wrapped.sheets.night.only', {
        what: night.episode ? t('wrapped.sheets.night.episode', { elided: /^[aeiouyhàâéèêîôû]/i.test(poster.title), title: quoted(poster.title) }) : quoted(poster.title),
      }),
      // An edition frozen before the plays of the night were kept has none
      listing: night.schedule?.length ? t(`wrapped.sheets.night.listing.${when}`) : null,
      schedule: scheduleOf(night.schedule || []),
    })
  }

  if (first_on_server || same_week) {
    const item = (first_on_server || same_week)!
    const kind = first_on_server ? 'first' : 'week'
    sheets.push({
      kind: 'server',
      label: t(`wrapped.sheets.server.label.${kind}`),
      first: !!first_on_server,
      lines: linesOf(`wrapped.sheets.server.lines.${kind}`),
      poster: item,
      title: item.title,
      lede: first_on_server
        ? t('wrapped.sheets.server.first', { title: quoted(item.title), place, others: first_on_server.others })
        : t('wrapped.sheets.server.week', { others: same_week!.others }),
      // The same, under the title it names
      bare: first_on_server
        ? t('wrapped.sheets.server.bare', { place, others: first_on_server.others })
        : t('wrapped.sheets.server.week', { others: same_week!.others }),
    })
  }

  if (only_you) {
    const { count, posters } = only_you
    const one = count === 1
    sheets.push({
      kind: 'figure',
      label: t('wrapped.sheets.onlyYou.label'),
      variant: 'only_you',
      lines: null,
      count,
      spoken: t('wrapped.count.movies', { count }),
      unit: t('wrapped.sheets.onlyYou.unit', { count }),
      details: one ? t('wrapped.sheets.onlyYou.one', { place }) : t('wrapped.sheets.onlyYou.many', { place, more: count > posters.length, shown: posters.length }),
      // A single film still shows, it is the one only this friend saw
      posters: one ? posters.slice(0, 1) : posters,
    })
  }

  if (!short && duo) {
    const { count, posters } = duo
    sheets.push({
      kind: 'duo',
      label: t('wrapped.sheets.duo.label'),
      lines: [t('wrapped.sheets.duo.label')],
      lede: t('wrapped.sheets.duo.lede', { place, count, more: count > posters.length, shown: posters.length }),
      posters: posters.map((poster) => {
        const who = nameOf(poster.with)
        const gap = gapOf(poster.days)
        return { ...poster, caption: [t('wrapped.sheets.duo.with', { name: who }), gap].filter(Boolean).join(', '), who, gap }
      }),
    })
  }

  if (!short && twin) {
    const { shared, total, posters } = twin
    const other = nameOf(twin.user_id)
    sheets.push({
      kind: 'figure',
      label: t('wrapped.sheets.twin.label'),
      variant: 'twin',
      lines: [t('wrapped.sheets.twin.label')],
      count: shared,
      spoken: t('wrapped.count.titles', { count: shared }),
      unit: t('wrapped.sheets.twin.unit', { name: other }),
      highlight: other,
      details: t('wrapped.sheets.twin.details', { name: other, shared, total }),
      posters,
      sides: { you: total, them: twin.theirs ?? null },
    })
  }

  if (!short && (dropped || dropped_show)) {
    sheets.push({
      kind: 'posters',
      label: t('wrapped.sheets.dropped.label'),
      variant: 'dropped',
      lines: linesOf('wrapped.sheets.dropped.lines'),
      items: bill([
        dropped && { what: t('wrapped.sheets.dropped.what'), poster: dropped, detail: t('wrapped.format.percent', { percent: dropped.percent }) },
        dropped_show && { what: t('wrapped.sheets.dropped.what'), poster: dropped_show, detail: episodeOf(dropped_show.season, dropped_show.episode) },
      ]),
    })
  }

  if (longest || oldest || rewatched) {
    sheets.push({
      kind: 'posters',
      label: t('wrapped.sheets.outliers.label'),
      variant: 'outliers',
      lines: linesOf('wrapped.sheets.outliers.lines'),
      items: bill([
        rewatched && { what: t('wrapped.sheets.outliers.rewatched'), poster: rewatched, detail: t('wrapped.sheets.outliers.times', { times: rewatched.times }), when: seen(rewatched.dates) },
        longest && { what: t('wrapped.sheets.outliers.longest'), poster: longest, detail: lasting(longest.minutes), when: seen(longest.dates) },
        oldest && { what: t('wrapped.sheets.outliers.oldest'), poster: oldest, detail: String(oldest.year), when: seen(oldest.dates) },
      ]),
    })
  }

  if (!short && genre) {
    const { lead } = genre
    const role = lead && t(`wrapped.sheets.genre.${lead.kind}`, { titles: lead.titles })
    sheets.push({
      kind: 'genre',
      label: t('wrapped.sheets.genre.label'),
      lines: [t('wrapped.sheets.genre.label')],
      name: genre.name,
      count: genre.titles === genre.total ? t('wrapped.sheets.genre.all') : t('wrapped.sheets.genre.some', { titles: genre.titles, total: genre.total }),
      posters: genre.posters,
      lead: lead && { name: lead.kind === 'show' ? quoted(lead.name) : lead.name, role: role!, posters: lead.posters },
    })
  }

  if (last) {
    sheets.push({
      kind: 'finale',
      label: t('wrapped.sheets.finale.label', { year }),
      lines: linesOf('wrapped.sheets.finale.lines'),
      poster: last,
      title: last.title,
      date: t('wrapped.sheets.finale.date', { date: dayOf(last.date), closed }),
      closed,
      end: t('wrapped.sheets.finale.end'),
    })
  }

  const colophon: Colophon = {
    short: short ? t('wrapped.sheets.colophon.short') : null,
    text: closed ? t('wrapped.sheets.colophon.closed', { year }) : t('wrapped.sheets.colophon.open', { today: today(), year }),
  }

  return { sheets, colophon, closed }
}
