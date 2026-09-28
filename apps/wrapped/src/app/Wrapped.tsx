import { useCallback, useEffect, useRef } from 'react'
import { animate, MotionValue, useMotionValue, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import type { Wrapped, WrappedPoster } from '@sensorr/sensorr'
import type { Share } from './App'
import { Painted, useRevealProgress } from './Painted'
import { Brushed, Lettering, Sheet } from './Sheet'

const TIME_ZONE = 'Europe/Paris'
// Under this many plays most sheets would be empty
const THRESHOLD = 10
// `wrapped.month_shows` runs from December of the previous year to November
const MONTHS = ['décembre', 'janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre']
// French puts a narrow space before a colon and a percent sign
const THIN = ' '

const number = new Intl.NumberFormat('fr-FR')
const plural = (count: number, one: string, many: string) => `${number.format(count)}\u00a0${count > 1 ? many : one}`
const today = () => new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', timeZone: TIME_ZONE })
// A date of the edition, read at noon so no time zone moves it to the day before
const dayOf = (date: string, weekday = false) => new Date(`${date}T12:00:00Z`)
  .toLocaleDateString('fr-FR', { weekday: weekday ? 'long' : undefined, day: 'numeric', month: 'long', timeZone: TIME_ZONE })
  .replace(/(^|\s)1 /, '$11er ')
const clock = (time: string) => time.replace(/^0?(\d+):/, '$1 h ')
const quoted = (title: string) => `«\u00a0${title}\u00a0»`
// « d’Entourage », « de Scrubs »
const of = (title: string) => `${/^[aeiouyhàâéèêîôû]/i.test(title) ? 'd’' : 'de '}${quoted(title)}`
const lasting = (minutes: number) => minutes < 60 ? `${minutes}\u00a0min` : `${Math.floor(minutes / 60)}\u00a0h\u00a0${String(minutes % 60).padStart(2, '0')}`
const rhythm = (perDay: number) => perDay >= 1.5 ? `${Math.round(perDay)} par jour`
  : perDay >= 1 ? 'plus d’un par jour'
    : perDay >= 0.8 ? 'presque un par jour'
      : `un tous les ${Math.round(1 / perDay)}\u00a0jours`
const suffix = (rank: number) => rank === 1 ? 'er' : 'e'

type Art = (item: WrappedPoster, kind?: 'thumb' | 'art', width?: number) => string | undefined
// A poster with what it stands for: a label lettered above its title, and a detail under it
type Billed = [string, WrappedPoster, string]

export const WrappedPage = ({ share, token }: { share: Share, token: string }) => {
  const { name, year, frozen, wrapped } = share
  const place = share.server || 'le serveur'
  const nameOf = (user_id: number) => share.names[user_id] || 'quelqu’un'
  const art: Art = (item, kind = 'thumb', width = 640) => item[kind]
    ? `/api/wrapped/share/${encodeURIComponent(token)}/images/${kind}?key=${encodeURIComponent(item.key)}&width=${width}`
    : undefined
  const short = wrapped.plays < THRESHOLD
  // 1 December at midnight in Paris: until the job freezes the edition, it is still closed
  const closed = frozen || Date.now() >= Date.UTC(year, 10, 30, 23)
  const { first_on_server, same_week, only_you, dropped, dropped_show, longest, oldest, rewatched } = wrapped
  const collage = [
    wrapped.first, wrapped.streak?.poster, wrapped.binge, wrapped.night?.poster, first_on_server || same_week,
    only_you?.posters[0], longest, oldest, wrapped.last, ...wrapped.month_shows,
  ].filter((item, index, items): item is WrappedPoster => !!item?.thumb && items.findIndex((other) => other?.key === item.key) === index).slice(0, 5)

  return (
    <main className="wall">
      <Opening name={name} year={year} place={place} wrapped={wrapped} closed={closed} posters={collage} art={art} />
      {wrapped.rank > 0 && <Rank rank={wrapped.rank} users={wrapped.server.users} place={place} />}
      {!short && wrapped.streak && <Streak streak={wrapped.streak} art={art} />}
      {!short && wrapped.month_shows.some(Boolean) && <Months shows={wrapped.month_shows} closed={closed} art={art} />}
      {!short && (wrapped.binge || wrapped.pace) && <Binge binge={wrapped.binge} pace={wrapped.pace} art={art} />}
      {/* An early evening that is the binge's own evening would tell it twice */}
      {!short && wrapped.night && (wrapped.night.late || wrapped.night.date !== wrapped.binge?.date) && <Night night={wrapped.night} art={art} />}
      {(first_on_server || same_week) && <Server first={first_on_server} week={same_week} place={place} art={art} />}
      {only_you && <OnlyYou onlyYou={only_you} place={place} art={art} />}
      {!short && wrapped.duo && <Duo duo={wrapped.duo} place={place} nameOf={nameOf} art={art} />}
      {!short && wrapped.twin && <Twin twin={wrapped.twin} name={nameOf(wrapped.twin.user_id)} art={art} />}
      {!short && (dropped || dropped_show) && (
        <Posters label="Pas fini, ou presque" lines={['Pas fini,', 'ou presque']} seed={19} art={art} items={[
          dropped && ['Arrêté', dropped, `à ${dropped.percent}${THIN}%, jamais repris`],
          dropped_show && ['Arrêté', dropped_show, `à l’épisode ${dropped_show.episode} de la saison ${dropped_show.season}, jamais repris depuis`],
        ]} />
      )}
      {(longest || oldest || rewatched) && (
        <Posters label="Hors normes" lines={['Hors', 'normes']} seed={20} art={art} items={[
          rewatched && ['Revu', rewatched, `${rewatched.times} fois`],
          longest && ['Le plus long', longest, lasting(longest.minutes)],
          oldest && ['Le plus vieux', oldest, `sorti en ${oldest.year}`],
        ]} />
      )}
      {!short && wrapped.genre && <Genre genre={wrapped.genre} art={art} />}
      {wrapped.last && <Finale last={wrapped.last} year={year} closed={closed} art={art} />}
      <Colophon year={year} closed={closed} short={short} />
    </main>
  )
}

const Opening = ({ name, year, place, wrapped, closed, posters, art }: { name: string, year: number, place: string, wrapped: Wrapped, closed: boolean, posters: WrappedPoster[], art: Art }) => {
  const reduced = useReducedMotion()
  const progress = useMotionValue(reduced ? 1 : 0)
  const { first, previous } = wrapped

  useEffect(() => {
    if (!reduced) {
      const controls = animate(progress, 1, { duration: 2.4, delay: 0.6, ease: [0.16, 1, 0.3, 1] })
      return () => controls.stop()
    }
  }, [reduced])

  return (
    <Sheet className="sheet-opening" label="Ouverture">
      <div className="collage" data-count={posters.length}>
        {posters.map((poster, index) => (
          <Painted key={poster.key} className={`collage-${index}`} src={art(poster)} alt={poster.title} progress={progress} />
        ))}
      </div>
      <Lettering as="h1" className="opening-title" text={`Rétrospective de ${name} ${year}`} highlight={name} />
      {first && <p className="lede">Ton année sur {place} a commencé le {dayOf(first.date)}, avec {quoted(first.title)}.</p>}
      <ul className="opening-figures">
        <li>En tout{THIN}: {plural(wrapped.hours, 'heure', 'heures')}, sur {plural(wrapped.evenings, 'soir', 'soirs')}.</li>
        {!!wrapped.movies && <li>{plural(wrapped.movies, 'film', 'films')}</li>}
        {!!wrapped.shows && <li>{plural(wrapped.shows, 'série', 'séries')}, {plural(wrapped.episodes, 'épisode', 'épisodes')}</li>}
        {previous && <li>{closed ? 'L’an dernier, tu en avais fait' : 'L’an dernier à la même date, tu en étais à'} {plural(previous.hours, 'heure', 'heures')}.</li>}
      </ul>
      <svg className="scroll-hint" viewBox="0 0 40 90" aria-hidden="true">
        <path d="M20 4 C 16 30, 25 52, 19 80 M8 64 C 13 72, 17 78, 19 84 C 23 76, 27 70, 33 62" />
      </svg>
    </Sheet>
  )
}

const Streak = ({ streak, art }: { streak: NonNullable<Wrapped['streak']>, art: Art }) => {
  const sheet = useRef<HTMLElement>(null)
  const progress = useRevealProgress(sheet)

  return (
    <Sheet ref={sheet} className="sheet-figures" label="Soirs d’affilée" style={{ '--digits': String(streak.evenings).length } as React.CSSProperties}>
      <Painted className="figures-poster" src={art(streak.poster)} alt={streak.poster.title} progress={progress} />
      <p className="figure-intro">Ta plus longue série sans rater un soir</p>
      <p className="figure">
        <span aria-hidden="true">{number.format(streak.evenings)}</span>
        <span className="visually-hidden">{plural(streak.evenings, 'soir', 'soirs')}</span>
      </p>
      <Lettering className="figure-unit" text="soirs d’affilée" seed={2} />
      <p className="figure-details">Du {dayOf(streak.from)} au {dayOf(streak.to)}, avec {quoted(streak.poster.title)} le plus souvent.</p>
    </Sheet>
  )
}

// Each month is a strip of the show watched the most, as tall as its episodes
const Months = ({ shows, closed, art }: { shows: Wrapped['month_shows'], closed: boolean, art: Art }) => {
  const reduced = useReducedMotion()
  const track = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: track, offset: ['start start', 'end end'] })
  const repaint = useTransform(scrollYProgress, [0, 0.7], [0, 1], { clamp: true })
  const month = new Date().toLocaleDateString('en-US', { month: 'numeric', timeZone: TIME_ZONE })
  const elapsed = closed ? 12 : (Number(month) % 12) + 1
  const episodes = shows.map((show) => show?.episodes || 0)
  const max = Math.max(...episodes, 1)
  const peak = episodes.indexOf(Math.max(...episodes))

  const compose = useCallback(async (boxWidth: number, boxHeight: number) => {
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(boxWidth)
    canvas.height = Math.round(boxHeight)
    const context = canvas.getContext('2d') as CanvasRenderingContext2D
    const width = canvas.width / 12

    await Promise.all(shows.slice(0, elapsed).map((show, index) => new Promise<void>((resolve) => {
      const src = show && art(show, 'thumb', 320)

      if (!src) {
        return resolve()
      }

      const image = new Image()
      image.onload = () => {
        const height = Math.max(24, (episodes[index] / max) * canvas.height)
        const gap = width * 0.08
        const [x, y, w, h] = [index * width + gap, canvas.height - height, width - gap * 2, height]
        const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight)
        const [sw, sh] = [w / scale, h / scale]
        context.drawImage(image, (image.naturalWidth - sw) / 2, (image.naturalHeight - sh) / 2, sw, sh, x, y, w, h)
        resolve()
      }
      // A poster that fails leaves its month empty rather than holding the others back
      image.onerror = () => resolve()
      image.src = src
    })))

    return canvas
  }, [shows, elapsed])

  return (
    <div ref={track} className="track" style={{ '--steps': reduced ? 0 : 1 } as React.CSSProperties}>
      <Sheet className="sheet-year" label="Tes séries, mois par mois">
        <Brushed lines={['Tes séries,', 'mois par mois']} seed={7} />
        <p className="lede">Chaque bande, c’est la série que tu as le plus regardée ce mois-là.</p>
        <Painted
          className="year-strips"
          compose={compose}
          alt={shows.slice(0, elapsed).map((show, index) => `${MONTHS[index]}${THIN}: ${show ? `${show.title}, ${plural(show.episodes, 'épisode', 'épisodes')}` : 'rien'}`).join(', ')}
          progress={repaint}
        />
        <ol className="year-months" aria-hidden="true">
          {MONTHS.map((name, index) => <li key={name} className={index >= elapsed ? 'year-month-future' : undefined}>{name[0]}</li>)}
        </ol>
        {shows[peak] && (
          <p className="year-peak">
            En <span className="year-peak-month">{MONTHS[peak]}</span>, c’était {quoted(shows[peak]!.title)}{THIN}: {plural(shows[peak]!.episodes, 'épisode', 'épisodes')}.
          </p>
        )}
      </Sheet>
    </div>
  )
}

const Binge = ({ binge, pace, art }: { binge: Wrapped['binge'], pace: Wrapped['pace'], art: Art }) => {
  const sheet = useRef<HTMLElement>(null)
  const progress = useRevealProgress(sheet)
  const lead = (binge || pace)!

  return (
    <Sheet ref={sheet} className="sheet-shows" label="Tes marathons de séries">
      <Brushed lines={binge ? [plural(binge.episodes, 'épisode', 'épisodes'), 'en une soirée'] : ['Ton rythme']} seed={4} />
      <Painted className="show-lead" src={art(lead, lead.art ? 'art' : 'thumb', 1280)} alt={lead.title} progress={progress} />
      <div className="show-lead-text">
        <Lettering as="h3" className="show-lead-title" text={lead.title} seed={5} />
        {binge && <p className="meta">Le {dayOf(binge.date, true)}, {lasting(binge.minutes)} d’affilée.</p>}
        {pace && (
          <p className="meta">
            {pace.key === lead.key ? 'En tout' : `Et ${quoted(pace.title)}`}{THIN}: {plural(pace.episodes, 'épisode', 'épisodes')} en {plural(pace.days, 'jour', 'jours')}, {rhythm(pace.episodes / pace.days)}.
          </p>
        )}
      </div>
    </Sheet>
  )
}

const Night = ({ night, art }: { night: NonNullable<Wrapped['night']>, art: Art }) => {
  const sheet = useRef<HTMLElement>(null)
  const progress = useRevealProgress(sheet)
  const { poster, late } = night

  return (
    <Sheet ref={sheet} className="sheet-night" label={late ? 'Ta nuit la plus tardive' : 'Ta plus grosse soirée'}>
      <Painted className="night-poster" src={art(poster, poster.thumb ? 'thumb' : 'art', 1280)} alt={poster.title} progress={progress} />
      <div className="night-text">
        <Brushed lines={late ? ['Ta nuit', 'la plus tardive'] : ['Ta plus grosse', 'soirée']} seed={8} />
        <p className="night-date">{late ? `Dans la nuit du ${dayOf(night.date, true)}` : dayOf(night.date, true)}</p>
        <p className="night-figures">
          Tu éteins à <strong>{clock(night.end)}</strong>{night.plays > 1 ? `, après ${[
            night.episodes && plural(night.episodes, 'épisode', 'épisodes'),
            night.plays - night.episodes && plural(night.plays - night.episodes, 'film', 'films'),
          ].filter(Boolean).join(' et ')}` : ''}.
        </p>
        <p className="night-figures">{night.plays > 1 ? 'La dernière' : 'Au programme'}{THIN}: {night.episode ? `un épisode ${of(poster.title)}` : quoted(poster.title)}.</p>
      </div>
    </Sheet>
  )
}

const Server = ({ first, week, place, art }: { first: Wrapped['first_on_server'], week: Wrapped['same_week'], place: string, art: Art }) => {
  const sheet = useRef<HTMLElement>(null)
  const progress = useRevealProgress(sheet)
  const item = (first || week)!

  return (
    <Sheet ref={sheet} className="sheet-server" label={first ? 'Avant tout le monde' : 'Tous la même semaine'}>
      <Brushed lines={first ? ['Avant', 'tout le monde'] : ['Tous la', 'même semaine']} seed={16} />
      <Painted className="server-poster" src={art(item)} alt={item.title} progress={progress} />
      <Lettering as="h3" className="server-title" text={item.title} seed={17} />
      <p className="lede">
        {first
          ? `Tu as vu ${quoted(item.title)} avant tout le monde sur ${place}. ${first.others === 1 ? 'Une personne l’a regardé' : `${first.others}\u00a0personnes l’ont regardé`} après toi.`
          : `Toi et ${plural(week!.others, 'autre personne', 'autres personnes')} l’avez regardé la même semaine.`}
      </p>
    </Sheet>
  )
}

// A few posters with their titles, the proof behind a count
const Strip = <P extends WrappedPoster>({ posters, layout, caption, progress, art }: { posters: P[], layout: 'row' | 'grid', caption?: (poster: P) => string, progress: MotionValue<number>, art: Art }) => (
  <ul className="strip" data-layout={layout}>
    {posters.map((poster) => (
      <li key={poster.key} className="strip-entry">
        <Painted className="strip-poster" src={art(poster, 'thumb', 320)} alt={poster.title} progress={progress} />
        <span className="strip-title">{poster.title}</span>
        {caption && <span className="strip-caption">{caption(poster)}</span>}
      </li>
    ))}
  </ul>
)

const OnlyYou = ({ onlyYou, place, art }: { onlyYou: NonNullable<Wrapped['only_you']>, place: string, art: Art }) => {
  const sheet = useRef<HTMLElement>(null)
  const progress = useRevealProgress(sheet)
  const { count, posters } = onlyYou
  const one = count === 1

  return (
    <Sheet ref={sheet} className="sheet-figures sheet-strip" label="Personne d’autre" style={{ '--digits': String(count).length } as React.CSSProperties}>
      <p className="figure">
        <span aria-hidden="true">{number.format(count)}</span>
        <span className="visually-hidden">{plural(count, 'film', 'films')}</span>
      </p>
      <Lettering className="figure-unit" text={one ? 'film que personne d’autre n’a vu' : 'films que personne d’autre n’a vus'} seed={3} />
      <p className="figure-details">
        {one ? `Cette année, personne d’autre sur ${place} ne l’a vu.` : `Cette année, personne d’autre sur ${place} ne les a vus. ${count > posters.length ? `Les ${posters.length} derniers` : 'Les voici'}${THIN}:`}
      </p>
      {!one && <Strip posters={posters} layout="row" progress={progress} art={art} />}
    </Sheet>
  )
}

const Duo = ({ duo, place, nameOf, art }: { duo: NonNullable<Wrapped['duo']>, place: string, nameOf: (user_id: number) => string, art: Art }) => {
  const sheet = useRef<HTMLElement>(null)
  const progress = useRevealProgress(sheet)
  const { count, posters } = duo

  return (
    <Sheet ref={sheet} className="sheet-duo" label="Vus à deux">
      <Brushed lines={['Vus à deux']} seed={22} />
      <p className="lede">
        Cette année sur {place}, vous n’êtes que deux à avoir vu {count === 1 ? 'ce titre' : `ces ${plural(count, 'titre', 'titres')}`}.
        {count > posters.length ? ` Les ${posters.length} plus vieux${THIN}:` : ''}
      </p>
      <Strip posters={posters} layout="grid" caption={(poster) => [poster.year, `avec ${nameOf(poster.with)}`].filter(Boolean).join(', ')} progress={progress} art={art} />
    </Sheet>
  )
}

const Twin = ({ twin, name, art }: { twin: NonNullable<Wrapped['twin']>, name: string, art: Art }) => {
  const sheet = useRef<HTMLElement>(null)
  const progress = useRevealProgress(sheet)
  const { shared, total, posters } = twin

  return (
    <Sheet ref={sheet} className="sheet-figures sheet-strip" label="Ton jumeau" style={{ '--digits': String(shared).length } as React.CSSProperties}>
      <Brushed lines={['Ton jumeau']} seed={23} />
      <p className="figure">
        <span aria-hidden="true">{number.format(shared)}</span>
        <span className="visually-hidden">{plural(shared, 'titre', 'titres')}</span>
      </p>
      <Lettering className="figure-unit" text={`titres en commun avec ${name}`} highlight={name} seed={24} />
      <p className="figure-details">{name} a vu {shared} de tes {plural(total, 'film et série', 'films et séries')}. Parmi les plus rares{THIN}:</p>
      <Strip posters={posters} layout="row" progress={progress} art={art} />
    </Sheet>
  )
}

// One poster per figure, a poster standing for two figures shows once with both
const Posters = ({ label, lines, seed, items, art }: { label: string, lines: string[], seed: number, items: (Billed | null | false)[], art: Art }) => {
  const sheet = useRef<HTMLElement>(null)
  const progress = useRevealProgress(sheet)
  const billed = (items.filter(Boolean) as Billed[]).reduce<Billed[]>((all, [what, poster, detail]) => {
    const same = all.find(([, other]) => other.key === poster.key)
    return same ? all.map((entry) => entry === same ? [`${same[0]} et ${what.toLowerCase()}`, poster, `${same[2]}, ${detail}`] : entry) : [...all, [what, poster, detail]]
  }, [])

  return (
    <Sheet ref={sheet} className="sheet-posters" label={label}>
      <Brushed lines={lines} seed={seed} />
      <ol className="posters" data-count={billed.length}>
        {billed.map(([what, poster, detail]) => (
          <li key={poster.key} className="posters-entry">
            <Painted className="posters-poster" src={art(poster, 'thumb', 640)} alt={poster.title} progress={progress} />
            <h3 className="posters-label">{what}</h3>
            <p className="posters-title">{poster.title}</p>
            <p className="meta">{detail}</p>
          </li>
        ))}
      </ol>
    </Sheet>
  )
}

const Genre = ({ genre, art }: { genre: NonNullable<Wrapped['genre']>, art: Art }) => {
  const sheet = useRef<HTMLElement>(null)
  const progress = useRevealProgress(sheet)
  const { name, titles, total, posters, lead } = genre
  const role = lead && {
    actor: `joue dans ${lead.titles}\u00a0de tes films et séries${THIN}:`,
    show: 'tourne en boucle.',
    director: `a signé ${lead.titles}\u00a0de tes films${THIN}:`,
  }[lead.kind]

  return (
    <Sheet ref={sheet} className="sheet-genre" label="Ton genre">
      <Brushed lines={['Ton genre']} seed={18} />
      <Lettering as="p" className="genre-name" text={name} highlight={name} seed={21} />
      <p className="genre-count">{titles === total ? 'Tous tes films et séries en sont' : `${titles} de tes ${total}\u00a0films et séries en sont`}, dont{THIN}:</p>
      <Strip posters={posters} layout="row" progress={progress} art={art} />
      {lead && (
        <p className="genre-lead">
          <span className="genre-lead-name">{lead.kind === 'show' ? quoted(lead.name) : lead.name}</span> {role}
        </p>
      )}
      {lead && lead.kind !== 'show' && <Strip posters={lead.posters} layout="row" progress={progress} art={art} />}
    </Sheet>
  )
}

const Rank = ({ rank, users, place }: { rank: number, users: number, place: string }) => (
  <Sheet className="sheet-rank" label="Ton rang">
    <p className="rank">
      <span aria-hidden="true">{rank}<sup>{suffix(rank)}</sup></span>
      <span className="visually-hidden">{rank}{suffix(rank)}</span>
    </p>
    <Lettering className="rank-unit" text={`spectateur sur ${users}`} seed={11} />
    <ol className="crowd" aria-hidden="true">
      {Array.from({ length: users }, (_, index) => <li key={index} className={index === rank - 1 ? 'crowd-you' : undefined} />)}
    </ol>
    <p className="rank-detail">
      {rank === 1 ? 'Personne n’a' : rank === 2 ? 'Une seule personne a' : `${rank <= 11 ? 'Seules ' : ''}${rank - 1}\u00a0personnes ont`} passé plus de temps que toi devant {place}.
    </p>
  </Sheet>
)

const Finale = ({ last, year, closed, art }: { last: NonNullable<Wrapped['last']>, year: number, closed: boolean, art: Art }) => {
  const sheet = useRef<HTMLElement>(null)
  const progress = useRevealProgress(sheet)

  return (
    <Sheet ref={sheet} className="sheet-finale" label={`Dernière séance ${year}`}>
      <Painted className="finale-poster" src={art(last, 'thumb', 1280)} alt={last.title} progress={progress} />
      <div className="finale-text">
        <Brushed lines={['Dernière séance']} seed={12} />
        <Lettering as="p" className="finale-title" text={last.title} seed={13} />
        <p className="finale-next">Le {dayOf(last.date)}{closed ? '' : ', pour l’instant'}.</p>
        {!closed && <p className="stamp stamp-finale">Provisoire</p>}
        <p className="finale-end">Fin.</p>
      </div>
    </Sheet>
  )
}

const Colophon = ({ year, closed, short }: { year: number, closed: boolean, short: boolean }) => (
  <footer className="colophon">
    {short && <p className="colophon-short">Ta rétrospective se remplit à chaque séance{THIN}: reviens la voir dans l’année.</p>}
    <p>{closed ? `Rétrospective ${year}, clôturée le 1er décembre ${year}.` : `Rétrospective au ${today()}, clôture le 1er décembre ${year}.`}</p>
  </footer>
)
