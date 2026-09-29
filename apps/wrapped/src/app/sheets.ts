import type { Wrapped, WrappedPoster } from '@sensorr/sensorr'
import type { Share } from './App'

// What each sheet says and shows, the same words whatever the look draws around them

export const TIME_ZONE = 'Europe/Paris'
// Under this many plays most sheets would be empty
const THRESHOLD = 10
// `wrapped.month_shows` runs from December of the previous year to November
export const MONTHS = ['décembre', 'janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre']
// French puts a narrow space before a colon and a percent sign
export const THIN = '\u202f'

export const number = new Intl.NumberFormat('fr-FR')
export const plural = (count: number, one: string, many: string) => `${number.format(count)} ${count > 1 ? many : one}`
const today = () => new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', timeZone: TIME_ZONE })
// A date of the edition, read at noon so no time zone moves it to the day before
export const dayOf = (date: string, weekday = false) => new Date(`${date}T12:00:00Z`)
  .toLocaleDateString('fr-FR', { weekday: weekday ? 'long' : undefined, day: 'numeric', month: 'long', timeZone: TIME_ZONE })
  .replace(/(^|\s)1 /, '$11er ')
const clock = (time: string) => time.replace(/^0?(\d+):/, '$1 h ')
export const quoted = (title: string) => `« ${title} »`
// « d’Entourage », « de Scrubs »
const of = (title: string) => `${/^[aeiouyhàâéèêîôû]/i.test(title) ? 'd’' : 'de '}${quoted(title)}`
const lasting = (minutes: number) => minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`
const rhythm = (perDay: number) => perDay >= 1.5 ? `${Math.round(perDay)} par jour`
  : perDay >= 1 ? 'plus d’un par jour'
    : perDay >= 0.8 ? 'presque un par jour'
      : `un tous les ${Math.round(1 / perDay)} jours`
export const suffix = (rank: number) => rank === 1 ? 'er' : 'e'
// Between one evening and the other viewer's
const gapOf = (days?: number) => days === undefined ? null : days === 0 ? 'le même soir' : days === 1 ? 'à un jour d’écart' : `à ${plural(days, 'jour', 'jours')} d’écart`

// A poster with what it stands for: a label above its title, and a detail under it
export type Billed = { what: string, poster: WrappedPoster, detail: string }

export type SheetModel =
  | { kind: 'opening', label: string, title: string, name: string, year: number, lede: string | null, first: string | null, figures: string[], posters: WrappedPoster[] }
  | { kind: 'rank', label: string, rank: number, suffix: string, users: number, unit: string, detail: string }
  | { kind: 'streak', label: string, evenings: number, poster: WrappedPoster, intro: string, unit: string, spoken: string, details: string, lead: boolean, nights: { day: string, poster: WrappedPoster | null }[] }
  | { kind: 'months', label: string, lines: string[], lede: string, shows: Wrapped['month_shows'], elapsed: number, max: number, alt: string, peak: { month: string, index: number, show: WrappedPoster & { episodes: number }, text: string } | null }
  | { kind: 'binge', label: string, lines: string[], poster: WrappedPoster, title: string, meta: string[], episodes: number | null, pace: (WrappedPoster & { episodes: number, days: number }) | null }
  | { kind: 'night', label: string, late: boolean, lines: string[], poster: WrappedPoster, date: string, end: string, after: string, last: string }
  | { kind: 'server', label: string, first: boolean, lines: string[], poster: WrappedPoster, title: string, lede: string }
  | { kind: 'figure', label: string, variant: 'only_you' | 'twin', lines: string[] | null, count: number, spoken: string, unit: string, highlight?: string, details: string, posters: WrappedPoster[] }
  | { kind: 'duo', label: string, lines: string[], lede: string, posters: (WrappedPoster & { caption: string })[] }
  | { kind: 'posters', label: string, variant: 'dropped' | 'outliers', lines: string[], items: Billed[] }
  | { kind: 'genre', label: string, lines: string[], name: string, count: string, posters: WrappedPoster[], lead: { name: string, role: string, posters: WrappedPoster[] } | null }
  | { kind: 'finale', label: string, lines: string[], poster: WrappedPoster, title: string, date: string, closed: boolean, end: string }

export type Colophon = { short: string | null, text: string }

// A poster standing for two figures shows once with both
const bill = (items: (Billed | null | false)[]) => (items.filter(Boolean) as Billed[]).reduce<Billed[]>((all, item) => {
  const same = all.find((other) => other.poster.key === item.poster.key)
  return same
    ? all.map((entry) => entry === same ? { what: `${same.what} et ${item.what.toLowerCase()}`, poster: item.poster, detail: `${same.detail}, ${item.detail}` } : entry)
    : [...all, item]
}, [])

export const sheetsOf = (share: Share) => {
  const { name, year, frozen, wrapped } = share
  const place = share.server || 'le serveur'
  const nameOf = (user_id: number) => share.names[user_id] || 'quelqu’un'
  const short = wrapped.plays < THRESHOLD
  // 1 December at midnight in Paris: until the job freezes the edition, it is still closed
  const closed = frozen || Date.now() >= Date.UTC(year, 10, 30, 23)
  const { first, previous, first_on_server, same_week, only_you, dropped, dropped_show, longest, oldest, rewatched, streak, binge, pace, night, duo, twin, genre, last } = wrapped
  const sheets: SheetModel[] = []

  const collage = [
    first, streak?.poster, binge, night?.poster, first_on_server || same_week,
    only_you?.posters[0], longest, oldest, last, ...wrapped.month_shows,
  ].filter((item, index, items): item is WrappedPoster => !!item?.thumb && items.findIndex((other) => other?.key === item.key) === index).slice(0, 5)

  sheets.push({
    kind: 'opening',
    label: 'Ouverture',
    title: `Rétrospective de ${name} ${year}`,
    name,
    year,
    lede: first ? `Ton année sur ${place} a commencé le ${dayOf(first.date)}, avec ${quoted(first.title)}.` : null,
    // The key of the first title of the year, when it is among the posters
    first: first?.key ?? null,
    figures: [
      `En tout${THIN}: ${plural(wrapped.hours, 'heure', 'heures')}, sur ${plural(wrapped.evenings, 'soir', 'soirs')}.`,
      wrapped.movies && plural(wrapped.movies, 'film', 'films'),
      wrapped.shows && `${plural(wrapped.shows, 'série', 'séries')}, ${plural(wrapped.episodes, 'épisode', 'épisodes')}`,
      previous && `${closed ? 'L’an dernier, tu en avais fait' : 'L’an dernier à la même date, tu en étais à'} ${plural(previous.hours, 'heure', 'heures')}.`,
    ].filter(Boolean) as string[],
    posters: collage,
  })

  if (wrapped.rank > 0) {
    const { rank } = wrapped
    sheets.push({
      kind: 'rank',
      label: 'Ton rang',
      rank,
      suffix: suffix(rank),
      users: wrapped.server.users,
      unit: `spectateur sur ${wrapped.server.users}`,
      detail: `${rank === 1 ? 'Personne n’a' : rank === 2 ? 'Une seule personne a' : `${rank <= 11 ? 'Seules ' : ''}${rank - 1} personnes ont`} passé plus de temps que toi devant ${place}.`,
    })
  }

  if (!short && streak) {
    sheets.push({
      kind: 'streak',
      label: 'Soirs d’affilée',
      evenings: streak.evenings,
      poster: streak.poster,
      intro: 'Ta plus longue série sans rater un soir',
      unit: 'soirs d’affilée',
      spoken: plural(streak.evenings, 'soir', 'soirs'),
      details: `Du ${dayOf(streak.from)} au ${dayOf(streak.to)}, ${streak.times === undefined ? `avec ${quoted(streak.poster.title)} le plus souvent`
        : streak.times > 1 ? `dont ${streak.times} soirs avec ${quoted(streak.poster.title)}` : 'un titre différent chaque soir'}.`,
      // The poster stands for the run only when it came back on more than one evening
      lead: streak.times === undefined || streak.times > 1,
      // An edition frozen before the titles of each evening were kept only has its dates
      nights: Array.from({ length: streak.evenings }, (_, index) => ({
        day: dayOf(new Date(Date.parse(`${streak.from}T12:00:00Z`) + index * 86400000).toISOString().slice(0, 10), true),
        poster: streak.nights?.[index] || null,
      })),
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
      label: 'Tes séries, mois par mois',
      lines: ['Tes séries,', 'mois par mois'],
      lede: 'Chaque bande, c’est la série que tu as le plus regardée ce mois-là.',
      shows,
      elapsed,
      max: Math.max(...episodes, 1),
      alt: shows.slice(0, elapsed).map((show, index) => `${MONTHS[index]}${THIN}: ${show ? `${show.title}, ${plural(show.episodes, 'épisode', 'épisodes')}` : 'rien'}`).join(', '),
      peak: show ? { month: MONTHS[peak], index: peak, show, text: `c’était ${quoted(show.title)}${THIN}: ${plural(show.episodes, 'épisode', 'épisodes')}.` } : null,
    })
  }

  if (!short && (binge || pace)) {
    const lead = (binge || pace)!
    sheets.push({
      kind: 'binge',
      label: 'Tes marathons de séries',
      lines: binge ? [plural(binge.episodes, 'épisode', 'épisodes'), 'en une soirée'] : ['Ton rythme'],
      poster: lead,
      title: lead.title,
      // Episodes watched in the binge evening, none when only the pace is known
      episodes: binge?.episodes ?? null,
      // The show of the pace line, when it is not the binge's own and wants its own poster
      pace: pace && pace.key !== lead.key ? pace : null,
      meta: [
        binge && `Le ${dayOf(binge.date, true)}, ${lasting(binge.minutes)} d’affilée.`,
        pace && `${pace.key === lead.key ? 'En tout' : `Et ${quoted(pace.title)}`}${THIN}: ${plural(pace.episodes, 'épisode', 'épisodes')} en ${plural(pace.days, 'jour', 'jours')}, ${rhythm(pace.episodes / pace.days)}.`,
      ].filter(Boolean) as string[],
    })
  }

  // An early evening that is the binge's own evening would tell it twice
  if (!short && night && (night.late || night.date !== binge?.date)) {
    const { poster, late } = night
    sheets.push({
      kind: 'night',
      label: late ? 'Ta nuit la plus tardive' : 'Ta plus grosse soirée',
      late,
      lines: late ? ['Ta nuit', 'la plus tardive'] : ['Ta plus grosse', 'soirée'],
      poster,
      date: late ? `Dans la nuit du ${dayOf(night.date, true)}` : dayOf(night.date, true),
      end: clock(night.end),
      after: night.plays > 1 ? `, après ${[
        night.episodes && plural(night.episodes, 'épisode', 'épisodes'),
        night.plays - night.episodes && plural(night.plays - night.episodes, 'film', 'films'),
      ].filter(Boolean).join(' et ')}` : '',
      last: `${night.plays > 1 ? 'La dernière' : 'Au programme'}${THIN}: ${night.episode ? `un épisode ${of(poster.title)}` : quoted(poster.title)}.`,
    })
  }

  if (first_on_server || same_week) {
    const item = (first_on_server || same_week)!
    sheets.push({
      kind: 'server',
      label: first_on_server ? 'Avant tout le monde' : 'Tous la même semaine',
      first: !!first_on_server,
      lines: first_on_server ? ['Avant', 'tout le monde'] : ['Tous la', 'même semaine'],
      poster: item,
      title: item.title,
      lede: first_on_server
        ? `Tu as vu ${quoted(item.title)} avant tout le monde sur ${place}. ${first_on_server.others === 1 ? 'Une personne l’a regardé' : `${first_on_server.others} personnes l’ont regardé`} après toi.`
        : `Toi et ${plural(same_week!.others, 'autre personne', 'autres personnes')} l’avez regardé la même semaine.`,
    })
  }

  if (only_you) {
    const { count, posters } = only_you
    const one = count === 1
    sheets.push({
      kind: 'figure',
      label: 'Personne d’autre',
      variant: 'only_you',
      lines: null,
      count,
      spoken: plural(count, 'film', 'films'),
      unit: one ? 'film que personne d’autre n’a jamais vu' : 'films que personne d’autre n’a jamais vus',
      details: one ? `Tu l’as vu cette année, et personne d’autre sur ${place} ne l’a jamais vu.` : `Tu les as vus cette année, et personne d’autre sur ${place} ne les a jamais vus. ${count > posters.length ? `Les ${posters.length} derniers` : 'Les voici'}${THIN}:`,
      // A single film still shows, it is the one only this friend saw
      posters: one ? posters.slice(0, 1) : posters,
    })
  }

  if (!short && duo) {
    const { count, posters } = duo
    sheets.push({
      kind: 'duo',
      label: 'Vus à deux',
      lines: ['Vus à deux'],
      lede: `Cette année sur ${place}, vous n’êtes que deux à avoir vu ${count === 1 ? 'ce titre' : `ces ${plural(count, 'titre', 'titres')}`}.${count > posters.length ? ` Les ${posters.length} que vous avez vus au plus près dans le temps${THIN}:` : ''}`,
      posters: posters.map((poster) => ({ ...poster, caption: [`avec ${nameOf(poster.with)}`, gapOf(poster.days)].filter(Boolean).join(', ') })),
    })
  }

  if (!short && twin) {
    const { shared, total, posters } = twin
    const other = nameOf(twin.user_id)
    sheets.push({
      kind: 'figure',
      label: 'Ton jumeau',
      variant: 'twin',
      lines: ['Ton jumeau'],
      count: shared,
      spoken: plural(shared, 'titre', 'titres'),
      unit: `titres en commun avec ${other}`,
      highlight: other,
      details: `${other} a vu ${shared} de tes ${plural(total, 'film et série', 'films et séries')}. Parmi les plus rares${THIN}:`,
      posters,
    })
  }

  if (!short && (dropped || dropped_show)) {
    sheets.push({
      kind: 'posters',
      label: 'Pas fini, ou presque',
      variant: 'dropped',
      lines: ['Pas fini,', 'ou presque'],
      items: bill([
        dropped && { what: 'Arrêté', poster: dropped, detail: `à ${dropped.percent}${THIN}%, jamais repris` },
        dropped_show && { what: 'Arrêté', poster: dropped_show, detail: `à l’épisode ${dropped_show.episode} de la saison ${dropped_show.season}, jamais repris depuis` },
      ]),
    })
  }

  if (longest || oldest || rewatched) {
    sheets.push({
      kind: 'posters',
      label: 'Hors normes',
      variant: 'outliers',
      lines: ['Hors', 'normes'],
      items: bill([
        rewatched && { what: 'Revu', poster: rewatched, detail: `${rewatched.times} fois` },
        longest && { what: 'Le plus long', poster: longest, detail: lasting(longest.minutes) },
        oldest && { what: 'Le plus vieux', poster: oldest, detail: `sorti en ${oldest.year}` },
      ]),
    })
  }

  if (!short && genre) {
    const { lead } = genre
    const role = lead && {
      actor: `joue dans ${lead.titles} de tes films et séries${THIN}:`,
      show: 'tourne en boucle.',
      director: `a signé ${lead.titles} de tes films${THIN}:`,
    }[lead.kind]
    sheets.push({
      kind: 'genre',
      label: 'Ton genre',
      lines: ['Ton genre'],
      name: genre.name,
      count: `${genre.titles === genre.total ? 'Tous tes films et séries en sont' : `${genre.titles} de tes ${genre.total} films et séries en sont`}, dont${THIN}:`,
      posters: genre.posters,
      lead: lead && { name: lead.kind === 'show' ? quoted(lead.name) : lead.name, role: role!, posters: lead.kind === 'show' ? [] : lead.posters },
    })
  }

  if (last) {
    sheets.push({
      kind: 'finale',
      label: `Dernière séance ${year}`,
      lines: ['Dernière séance'],
      poster: last,
      title: last.title,
      date: `Le ${dayOf(last.date)}${closed ? '' : ', pour l’instant'}.`,
      closed,
      end: 'Fin.',
    })
  }

  const colophon: Colophon = {
    short: short ? `Ta rétrospective se remplit à chaque séance${THIN}: reviens la voir dans l’année.` : null,
    text: closed ? `Rétrospective ${year}, clôturée le 1er décembre ${year}.` : `Rétrospective au ${today()}, clôture le 1er décembre ${year}.`,
  }

  return { sheets, colophon, closed }
}
