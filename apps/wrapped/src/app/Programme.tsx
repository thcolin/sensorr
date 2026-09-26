import { useEffect, useRef, useState } from 'react'
import { animate, MotionValue, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import type { WrappedMovie, WrappedShow } from '@sensorr/sensorr'
import type { Share } from './App'
import { Painted, useRevealProgress } from './Painted'
import { Lettering, Sheet } from './Sheet'

const TIME_ZONE = 'Europe/Paris'
// Under this many plays a programme would be mostly empty sheets
const THRESHOLD = 10
// `wrapped.months` runs from December of the previous year to November
const MONTHS = ['décembre', 'janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre']

const number = new Intl.NumberFormat('fr-FR')
const plural = (count: number, one: string, many: string) => `${number.format(count)} ${count > 1 ? many : one}`
const today = () => new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', timeZone: TIME_ZONE })
const ordinal = (rank: number) => rank === 1 ? '1er' : `${rank}e`
const Ordinal = ({ rank }: { rank: number }) => <>{rank}<sup>{rank === 1 ? 'er' : 'e'}</sup></>

type Titled = Pick<WrappedMovie, 'key' | 'title' | 'thumb' | 'art'>

export const Programme = ({ share, token }: { share: Share, token: string }) => {
  const { name, year, frozen, wrapped } = share
  const art = (item: Titled, kind: 'thumb' | 'art' = 'thumb', width = 640) => item[kind]
    ? `/api/wrapped/share/${encodeURIComponent(token)}/images/${kind}?key=${encodeURIComponent(item.key)}&width=${width}`
    : undefined
  const short = wrapped.plays < THRESHOLD

  return (
    <main className="wall">
      <Opening name={name} year={year} posters={[...wrapped.top_movies, ...wrapped.top_shows].filter((item) => item.thumb).slice(0, 5)} art={art} />
      <Figures backdrop={[wrapped.palme, wrapped.grand_prix].find((item) => item?.art)} art={art} hours={wrapped.hours} plays={wrapped.plays} movies={wrapped.movies} shows={wrapped.shows} episodes={wrapped.episodes} />
      {!short && (
        <>
          {!!wrapped.top_movies.length && <Selection movies={wrapped.top_movies} art={art} />}
          {!!wrapped.top_shows.length && <Shows shows={wrapped.top_shows} art={art} />}
          {!!wrapped.cycles.length && <Cycles cycles={wrapped.cycles} art={art} />}
          <Year months={wrapped.months} frozen={frozen} />
          {wrapped.night && <Night night={wrapped.night} />}
          <Profile wrapped={wrapped} />
          {wrapped.palme && <Awards palme={wrapped.palme} grandPrix={wrapped.grand_prix} jury={wrapped.jury} frozen={frozen} art={art} />}
          <Rank rank={wrapped.rank} users={wrapped.server.users} hours={wrapped.hours} median={wrapped.server.median_hours} />
        </>
      )}
      <Colophon year={year} frozen={frozen} short={short} />
    </main>
  )
}

type Art = (item: Titled, kind?: 'thumb' | 'art', width?: number) => string | undefined

const Opening = ({ name, year, posters, art }: { name: string, year: number, posters: Titled[], art: Art }) => {
  const reduced = useReducedMotion()
  const progress = useMotionValue(reduced ? 1 : 0)

  useEffect(() => {
    if (!reduced) {
      const controls = animate(progress, 1, { duration: 2.4, delay: 0.6, ease: [0.16, 1, 0.3, 1] })
      return () => controls.stop()
    }
  }, [reduced])

  return (
    <Sheet className="sheet-opening" label="Ouverture">
      <div className="collage" aria-hidden={!posters.length}>
        {posters.map((poster, index) => (
          <Painted key={poster.key} className={`collage-${index}`} src={art(poster)} alt={poster.title} progress={progress} />
        ))}
      </div>
      <Lettering as="h1" className="opening-title" text={`Programme de ${name} ${year}`} highlight={name} />
      <p className="lede">Ce que tu as regardé sur le Plex de Thomas, du 1er décembre {year - 1} au 30 novembre {year}.</p>
      <svg className="scroll-hint" viewBox="0 0 40 90" aria-hidden="true">
        <path d="M20 4 C 16 30, 25 52, 19 80 M8 64 C 13 72, 17 78, 19 84 C 23 76, 27 70, 33 62" />
      </svg>
    </Sheet>
  )
}

const Figures = ({ backdrop, art, hours, plays, movies, shows, episodes }: { backdrop?: Titled | null, art: Art, hours: number, plays: number, movies: number, shows: number, episodes: number }) => {
  const sheet = useRef<HTMLElement>(null)
  const progress = useRevealProgress(sheet)

  return (
    <Sheet ref={sheet} className="sheet-figures" label="Chiffres">
      {backdrop && <Painted className="backdrop" src={art(backdrop, 'art', 1280)} alt={backdrop.title} progress={progress} />}
      <p className="figure" aria-label={plural(hours, 'heure', 'heures')}>
        <span aria-hidden="true">{number.format(hours)}</span>
      </p>
      <Lettering className="figure-unit" text={hours > 1 ? 'heures devant l’écran' : 'heure devant l’écran'} seed={2} />
      <ul className="figure-details">
        <li>{plural(plays, 'séance', 'séances')}</li>
        {!!movies && <li>{plural(movies, 'film', 'films')}</li>}
        {!!shows && <li>{plural(shows, 'série', 'séries')}, {plural(episodes, 'épisode', 'épisodes')}</li>}
      </ul>
    </Sheet>
  )
}

// Pinned while the scroll runs through the ten posters, each one repainted over its own stretch
const Selection = ({ movies, art }: { movies: WrappedMovie[], art: Art }) => {
  const reduced = useReducedMotion()
  const track = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: track, offset: ['start start', 'end end'] })
  const [index, setIndex] = useState(0)
  const repaint = useTransform(scrollYProgress, (value) => Math.min(1, ((value * movies.length) % 1) / 0.6 + (value >= 1 ? 1 : 0)))

  useMotionValueEvent(scrollYProgress, 'change', (value) => setIndex(Math.min(movies.length - 1, Math.floor(value * movies.length))))

  if (reduced) {
    return (
      <Sheet className="sheet-selection sheet-selection-static" label="Sélection officielle">
        <Lettering text="Sélection officielle" seed={3} />
        <ol className="selection-list">
          {movies.map((movie) => <li key={movie.key}><SelectionEntry movie={movie} art={art} progress={repaint} /></li>)}
        </ol>
      </Sheet>
    )
  }

  const movie = movies[index]
  return (
    <div ref={track} className="track" style={{ '--steps': movies.length * 0.6 } as React.CSSProperties}>
      <Sheet className="sheet-selection" label="Sélection officielle">
        <Lettering text="Sélection officielle" seed={3} />
        <SelectionEntry movie={movie} art={art} progress={repaint} />
        <p className="selection-count" aria-live="polite">{index + 1}&thinsp;/&thinsp;{movies.length}</p>
      </Sheet>
    </div>
  )
}

const SelectionEntry = ({ movie, art, progress }: { movie: WrappedMovie, art: Art, progress: MotionValue<number> }) => (
  <figure className="selection-entry">
    <Painted className="selection-poster" src={art(movie)} alt={movie.title} progress={progress} />
    <figcaption>
      <Lettering as="h3" className="selection-title" text={movie.title} seed={movie.title.length} />
      <p className="meta">{[movie.year, movie.plays > 1 && `vu ${movie.plays} fois`].filter(Boolean).join(' · ')}</p>
    </figcaption>
  </figure>
)

const Shows = ({ shows, art }: { shows: WrappedShow[], art: Art }) => {
  const sheet = useRef<HTMLElement>(null)
  const progress = useRevealProgress(sheet)
  const [first, ...others] = shows

  return (
    <Sheet ref={sheet} className="sheet-shows" label="Séries">
      <Lettering text="Tes séries" seed={4} />
      <figure className="show-lead">
        <Painted className="backdrop" src={art(first, first.art ? 'art' : 'thumb', 1280)} alt={first.title} progress={progress} />
        <figcaption>
          <Lettering as="h3" text={first.title} seed={5} />
          <p className="meta">{plural(first.episodes, 'épisode', 'épisodes')}</p>
        </figcaption>
      </figure>
      {!!others.length && (
        <ul className="show-others">
          {others.map((show) => (
            <li key={show.key}>
              <Painted className="show-other-poster" src={art(show, 'thumb', 320)} alt={show.title} progress={progress} />
              <span className="show-other-title">{show.title}</span>
              <span className="meta">{plural(show.episodes, 'épisode', 'épisodes')}</span>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  )
}

const Cycles = ({ cycles, art }: { cycles: Share['wrapped']['cycles'], art: Art }) => {
  const sheet = useRef<HTMLElement>(null)
  const progress = useRevealProgress(sheet)

  return (
    <Sheet ref={sheet} className="sheet-cycles" label="Cycles">
      <Lettering text="Les cycles" seed={6} />
      <ol className="cycles">
        {cycles.map((cycle) => (
          <li key={`${cycle.kind}-${cycle.name}`} className="cycle">
            <Painted className="cycle-poster" src={art({ key: cycle.key, title: cycle.name, thumb: cycle.thumb }, 'thumb', 320)} alt={cycle.name} progress={progress} />
            <h3 className="cycle-name">{cycle.name}</h3>
            <p className="meta">{cycle.kind === 'show' ? `série · ${plural(cycle.count, 'épisode', 'épisodes')}` : `réalisation · ${plural(cycle.count, 'film', 'films')}`}</p>
            <ol className="cycle-months" aria-label={`En ${cycle.months.map((month) => MONTHS[month % 12]).join(', ')}`}>
              {MONTHS.map((month, index) => (
                <li key={month} aria-hidden="true" className={cycle.months.includes(index === 0 ? 12 : index) ? 'cycle-month-on' : undefined}>{month[0]}</li>
              ))}
            </ol>
          </li>
        ))}
      </ol>
    </Sheet>
  )
}

const Year = ({ months, frozen }: { months: number[], frozen: boolean }) => {
  const reduced = useReducedMotion()
  const track = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: track, offset: ['start start', 'end end'] })
  const drawn = useTransform(scrollYProgress, [0, 0.8], [0, 1], { clamp: true })
  const month = new Date().toLocaleDateString('en-US', { month: 'numeric', timeZone: TIME_ZONE })
  const elapsed = frozen ? 12 : (Number(month) % 12) + 1
  const max = Math.max(...months, 1)
  const peak = months.indexOf(Math.max(...months))
  const x = (index: number) => 10 + index * (380 / 11)
  const points = months.slice(0, elapsed).map((hours, index) => [x(index), 250 - (hours / max) * 200])
  const ridge = points.map(([px, py], index) => `${index ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`).join(' ')
  const reveal = useTransform(drawn, (value) => `inset(0 ${(100 - value * 100).toFixed(1)}% 0 0)`)

  return (
    <div ref={track} className="track" style={{ '--steps': reduced ? 0 : 1 } as React.CSSProperties}>
      <Sheet className="sheet-year" label="L'année mois par mois">
        <Lettering text="L’année, mois par mois" seed={7} />
        <svg className="year-curve" viewBox="0 0 400 320" preserveAspectRatio="none" role="img" aria-label={months.slice(0, elapsed).map((hours, index) => `${MONTHS[index]} ${number.format(hours)} h`).join(', ')}>
          <defs>
            <filter id="brush">
              <feTurbulence type="fractalNoise" baseFrequency="0.04 0.9" numOctaves="2" seed="3" />
              <feDisplacementMap in="SourceGraphic" scale="7" />
            </filter>
          </defs>
          <motion.g style={{ clipPath: reduced ? 'none' : reveal }}>
            <path className="year-mass" d={`${ridge} h17 V330 L-20 330 L-20 ${points[0][1].toFixed(1)} Z`} filter="url(#brush)" />
            <path className="year-ridge" d={ridge} filter="url(#brush)" />
          </motion.g>
          {elapsed < 12 && <path className="year-future" d={`M${x(elapsed - 1).toFixed(1)} 250 H390`} />}
        </svg>
        <ol className="year-months" aria-hidden="true">
          {MONTHS.map((name, index) => <li key={name} className={index >= elapsed ? 'year-month-future' : undefined}>{name[0]}</li>)}
        </ol>
        {months[peak] > 0 && (
          <p className="year-peak">
            <span className="year-peak-month">{MONTHS[peak]}</span>, ton mois le plus chargé : {number.format(months[peak])} h
          </p>
        )}
      </Sheet>
    </div>
  )
}

const Night = ({ night }: { night: NonNullable<Share['wrapped']['night']> }) => {
  const date = new Date(`${night.date}T12:00:00Z`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TIME_ZONE })

  return (
    <Sheet className="sheet-night" label="Ton plus long marathon">
      <Lettering text="Ton plus long marathon" seed={8} />
      <p className="night-date">{date}</p>
      <p className="night-figures">
        {night.episodes ? plural(night.episodes, 'épisode', 'épisodes') : plural(night.plays, 'séance', 'séances')} d’affilée, jusqu’à <strong>{night.end.replace(':', ' h ')}</strong>
      </p>
      <ul className="night-titles">
        {night.titles.map((title) => <li key={title}>{title}</li>)}
      </ul>
    </Sheet>
  )
}

const Profile = ({ wrapped }: { wrapped: Share['wrapped'] }) => {
  const lines = [
    wrapped.decade && ['Ta décennie', `les années ${wrapped.decade}`],
    wrapped.genre && ['Ton genre', wrapped.genre],
    wrapped.director && ['Ta réalisation', wrapped.director],
    wrapped.film_age && ['Tes films sortent en moyenne en', String(wrapped.film_age)],
    wrapped.movies > 0 && ['Vus par toi seul sur le serveur', `${wrapped.only_you_pct} % de tes films`],
  ].filter(Boolean) as [string, string][]

  if (!lines.length) {
    return null
  }

  return (
    <Sheet className="sheet-profile" label="Ton profil">
      <Lettering text="Ton profil" seed={9} />
      <dl className="profile">
        {lines.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </Sheet>
  )
}

const Awards = ({ palme, grandPrix, jury, frozen, art }: { palme: WrappedMovie, grandPrix: WrappedShow | null, jury: WrappedMovie | null, frozen: boolean, art: Art }) => {
  const sheet = useRef<HTMLElement>(null)
  const progress = useRevealProgress(sheet)
  const awards = [
    ['Palme d’or', 'le film que tu as le plus vu', palme],
    grandPrix && ['Grand Prix', 'la série que tu as le plus suivie', grandPrix],
    jury && ['Prix du jury', 'le plus ancien des films que toi seul as vus', jury],
  ].filter(Boolean) as [string, string, Titled][]

  return (
    <Sheet ref={sheet} className="sheet-awards" label="Palmarès">
      <Lettering text="Palmarès" seed={10} />
      <ol className="awards">
        {awards.map(([prize, reason, item], index) => (
          <li key={prize} className={index ? 'award' : 'award award-lead'}>
            <Painted className="award-poster" src={art(item, 'thumb', index ? 320 : 640)} alt={item.title} progress={progress} />
            <div>
              <h3 className="award-prize">{prize}</h3>
              <p className="award-title">{item.title}</p>
              <p className="meta">{reason}</p>
            </div>
          </li>
        ))}
      </ol>
      {!frozen && <p className="stamp">Provisoire</p>}
    </Sheet>
  )
}

const Rank = ({ rank, users, hours, median }: { rank: number, users: number, hours: number, median: number }) => (
  <Sheet className="sheet-rank" label="Ton rang">
    <p className="rank" aria-label={`${ordinal(rank)} sur ${users}`}>
      <span aria-hidden="true"><Ordinal rank={rank} /></span>
    </p>
    <Lettering text={`sur ${users} spectateurs`} seed={11} />
    <ol className="crowd" aria-hidden="true">
      {Array.from({ length: users }, (_, index) => <li key={index} className={index === rank - 1 ? 'crowd-you' : undefined} />)}
    </ol>
    <p className="rank-detail">
      Classement anonyme aux heures regardées. Tu en es à {plural(hours, 'heure', 'heures')}, la moitié du serveur est sous {plural(median, 'heure', 'heures')}.
    </p>
  </Sheet>
)

const Colophon = ({ year, frozen, short }: { year: number, frozen: boolean, short: boolean }) => (
  <footer className="colophon">
    {short && <p className="colophon-short">Ton programme se remplit à chaque séance : reviens le voir dans l’année.</p>}
    <p>{frozen ? `Programme ${year}, clôturé le 1er décembre ${year}.` : `Programme au ${today()}, clôture le 1er décembre ${year}.`}</p>
  </footer>
)
