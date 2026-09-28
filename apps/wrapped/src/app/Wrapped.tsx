import { useCallback, useEffect, useRef } from 'react'
import { animate, useMotionValue, useReducedMotion, useScroll, useTransform } from 'framer-motion'
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
const quoted = (title: string) => `« ${title} »`
const suffix = (rank: number) => rank === 1 ? 'er' : 'e'

type Art = (item: WrappedPoster, kind?: 'thumb' | 'art', width?: number) => string | undefined
// A poster with what it stands for: a label lettered above its title, and a detail under it
type Billed = [string, WrappedPoster, string]

export const WrappedPage = ({ share, token }: { share: Share, token: string }) => {
  const { name, year, frozen, wrapped } = share
  const art: Art = (item, kind = 'thumb', width = 640) => item[kind]
    ? `/api/wrapped/share/${encodeURIComponent(token)}/images/${kind}?key=${encodeURIComponent(item.key)}&width=${width}`
    : undefined
  const short = wrapped.plays < THRESHOLD
  // 1 December at midnight in Paris: until the job freezes the edition, it is still closed
  const closed = frozen || Date.now() >= Date.UTC(year, 10, 30, 23)
  const { first_on_server, same_week, only_you, dropped, dropped_show, slowest, longest, oldest, rewatched } = wrapped
  const collage = [
    wrapped.first, wrapped.streak?.poster, wrapped.binge, wrapped.night?.poster, first_on_server || same_week,
    only_you?.poster, longest, oldest, wrapped.last, ...wrapped.month_shows,
  ].filter((item, index, items): item is WrappedPoster => !!item?.thumb && items.findIndex((other) => other?.key === item.key) === index).slice(0, 5)

  return (
    <main className="wall">
      <Opening name={name} year={year} wrapped={wrapped} closed={closed} posters={collage} art={art} />
      <Rank rank={wrapped.rank} users={wrapped.server.users} hours={wrapped.hours} />
      {!short && wrapped.streak && <Streak streak={wrapped.streak} art={art} />}
      {!short && wrapped.month_shows.some(Boolean) && <Months shows={wrapped.month_shows} closed={closed} art={art} />}
      {!short && (wrapped.binge || wrapped.pace) && <Binge binge={wrapped.binge} pace={wrapped.pace} art={art} />}
      {/* An evening before midnight that is the binge's own evening would tell it twice */}
      {!short && wrapped.night && (wrapped.night.start < '06:00' || wrapped.night.date !== wrapped.binge?.date) && <Night night={wrapped.night} art={art} />}
      {(first_on_server || same_week) && <Server first={first_on_server} week={same_week} art={art} />}
      {only_you && <OnlyYou onlyYou={only_you} art={art} />}
      {!short && (dropped || dropped_show || slowest) && (
        <Posters label="Pas fini, ou presque" lines={['Pas fini,', 'ou presque']} seed={19} art={art} items={[
          dropped && ['Lâché', dropped, `à ${dropped.percent}${THIN}%`],
          dropped_show && ['Arrêté', dropped_show, `saison ${dropped_show.season}, épisode ${dropped_show.episode}, sur ${plural(dropped_show.episode_count, 'épisode', 'épisodes')}`],
          slowest && ['Fini', slowest, `en ${plural(slowest.days, 'jour', 'jours')}`],
        ]} />
      )}
      {(longest || oldest || rewatched) && (
        <Posters label="Hors normes" lines={['Hors', 'normes']} seed={20} art={art} items={[
          rewatched && ['Revu', rewatched, `${rewatched.times} fois`],
          longest && ['Le plus long', longest, plural(longest.minutes, 'minute', 'minutes')],
          oldest && ['Le plus vieux', oldest, `sorti en ${oldest.year}`],
        ]} />
      )}
      {!short && wrapped.sign && <Sign sign={wrapped.sign} art={art} />}
      {wrapped.last && <Finale last={wrapped.last} year={year} closed={closed} art={art} />}
      <Colophon year={year} closed={closed} short={short} />
    </main>
  )
}

const Opening = ({ name, year, wrapped, closed, posters, art }: { name: string, year: number, wrapped: Wrapped, closed: boolean, posters: WrappedPoster[], art: Art }) => {
  const reduced = useReducedMotion()
  const progress = useMotionValue(reduced ? 1 : 0)
  const { first, previous } = wrapped
  const gap = previous && Math.round(100 * (wrapped.hours - previous.hours) / previous.hours)

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
      {first && <p className="lede">Tout a commencé le {dayOf(first.date)} avec {quoted(first.title)}.</p>}
      <ul className="opening-figures">
        <li>{plural(wrapped.evenings, 'soir', 'soirs')}, {plural(wrapped.hours, 'heure', 'heures')}</li>
        {!!wrapped.movies && <li>{plural(wrapped.movies, 'film', 'films')}</li>}
        {!!wrapped.shows && <li>{plural(wrapped.shows, 'série', 'séries')}, {plural(wrapped.episodes, 'épisode', 'épisodes')}</li>}
        {previous && !!gap && <li className="opening-gap">{gap > 0 ? `+${gap}` : `−${-gap}`}{THIN}% d’heures par rapport à {previous.year}{closed ? '' : ', à la même date'}</li>}
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
      <p className="figure">
        <span aria-hidden="true">{number.format(streak.evenings)}</span>
        <span className="visually-hidden">{plural(streak.evenings, 'soir', 'soirs')}</span>
      </p>
      <Lettering className="figure-unit" text="soirs d’affilée" seed={2} />
      <p className="figure-details">Du {dayOf(streak.from)} au {dayOf(streak.to)}, sans rater une séance. Surtout {quoted(streak.poster.title)}.</p>
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
            <span className="year-peak-month">{MONTHS[peak]}</span>, c’était {quoted(shows[peak]!.title)}{THIN}: {plural(shows[peak]!.episodes, 'épisode', 'épisodes')}.
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
        {binge && <p className="meta">Le {dayOf(binge.date, true)}.</p>}
        {pace && (
          <p className="meta">
            {pace.key === lead.key ? 'En tout' : `Et ${quoted(pace.title)}`}, {plural(pace.episodes, 'épisode', 'épisodes')} en {plural(pace.days, 'jour', 'jours')}.
          </p>
        )}
      </div>
    </Sheet>
  )
}

const Night = ({ night, art }: { night: NonNullable<Wrapped['night']>, art: Art }) => {
  const sheet = useRef<HTMLElement>(null)
  const progress = useRevealProgress(sheet)
  const poster = night.poster
  // Launched past midnight, before the evening ends at 06:00
  const late = night.start < '06:00'

  return (
    <Sheet ref={sheet} className="sheet-night" label={late ? 'Ta nuit la plus tardive' : 'Ta plus grosse soirée'}>
      <Painted className="night-poster" src={art(poster, poster.thumb ? 'thumb' : 'art', 1280)} alt={poster.title} progress={progress} />
      <div className="night-text">
        <Brushed lines={late ? ['Ta nuit', 'la plus tardive'] : ['Ta plus grosse', 'soirée']} seed={8} />
        <p className="night-date">{late ? `Dans la nuit du ${dayOf(night.date, true)}` : dayOf(night.date, true)}</p>
        <p className="night-figures">
          {late ? 'À ' : 'La dernière à '}<strong>{clock(night.start)}</strong>, tu lances {late ? 'encore ' : ''}{quoted(poster.title)}.
        </p>
        {night.plays > 1 && <p className="night-figures">{plural(night.plays, 'séance', 'séances')} ce soir-là.</p>}
      </div>
    </Sheet>
  )
}

const Server = ({ first, week, art }: { first: Wrapped['first_on_server'], week: Wrapped['same_week'], art: Art }) => {
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
          ? `Tu l’as lancé le premier sur le serveur. ${plural(first.others, 'autre spectateur a', 'autres spectateurs ont')} suivi.`
          : `Toi et ${plural(week!.others, 'autre spectateur', 'autres spectateurs')}, à une semaine près.`}
      </p>
    </Sheet>
  )
}

const OnlyYou = ({ onlyYou, art }: { onlyYou: NonNullable<Wrapped['only_you']>, art: Art }) => {
  const sheet = useRef<HTMLElement>(null)
  const progress = useRevealProgress(sheet)
  const one = onlyYou.count === 1

  return (
    <Sheet ref={sheet} className="sheet-figures" label="Toi seul" style={{ '--digits': String(onlyYou.count).length } as React.CSSProperties}>
      <Painted className="figures-poster" src={art(onlyYou.poster)} alt={onlyYou.poster.title} progress={progress} />
      <p className="figure">
        <span aria-hidden="true">{number.format(onlyYou.count)}</span>
        <span className="visually-hidden">{plural(onlyYou.count, 'film', 'films')}</span>
      </p>
      <Lettering className="figure-unit" text={one ? 'film que personne d’autre n’a lancé' : 'films que personne d’autre n’a lancés'} seed={3} />
      <p className="figure-details">{one ? `C’est ${quoted(onlyYou.poster.title)}.` : `Le dernier en date${THIN}: ${quoted(onlyYou.poster.title)}.`}</p>
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

const Sign = ({ sign, art }: { sign: NonNullable<Wrapped['sign']>, art: Art }) => {
  const sheet = useRef<HTMLElement>(null)
  const progress = useRevealProgress(sheet)
  const { genre, ascendant } = sign
  const lead = ascendant && {
    actor: `en tête d’affiche de ${ascendant.titles}\u00a0de tes films et séries`,
    show: 'en boucle',
    director: `derrière ${ascendant.titles}\u00a0de tes films`,
  }[ascendant.kind]

  return (
    <Sheet ref={sheet} className="sheet-sign" label="Ton genre">
      <Brushed lines={['Ton genre']} seed={18} />
      {ascendant?.poster && <Painted className="sign-poster" src={art(ascendant.poster)} alt={ascendant.poster.title} progress={progress} />}
      <Lettering as="p" className="sign-genre" text={genre} highlight={genre} seed={21} />
      {ascendant && (
        <p className="sign-lead">
          <span className="sign-name">{ascendant.kind === 'show' ? quoted(ascendant.name) : ascendant.name}</span> {lead}
        </p>
      )}
    </Sheet>
  )
}

const Rank = ({ rank, users, hours }: { rank: number, users: number, hours: number }) => (
  <Sheet className="sheet-rank" label="Ton rang">
    <p className="rank">
      <span aria-hidden="true">{rank}<sup>{suffix(rank)}</sup></span>
      <span className="visually-hidden">{rank}{suffix(rank)}</span>
    </p>
    <Lettering className="rank-unit" text={`spectateur sur ${users}`} seed={11} />
    <ol className="crowd" aria-hidden="true">
      {Array.from({ length: users }, (_, index) => <li key={index} className={index === rank - 1 ? 'crowd-you' : undefined} />)}
    </ol>
    <p className="rank-detail">{plural(hours, 'heure', 'heures')} au cinéma de Thomas. Chaque trait est un spectateur, classé aux heures regardées, sans nom.</p>
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
        <p className="finale-next">Le {dayOf(last.date)}.</p>
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
