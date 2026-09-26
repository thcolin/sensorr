import { useCallback, useEffect, useRef, useState } from 'react'
import { animate, MotionValue, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import type { WrappedMovie, WrappedPoster, WrappedShow } from '@sensorr/sensorr'
import type { Share } from './App'
import { Painted, useRevealProgress } from './Painted'
import { Brushed, Lettering, Sheet } from './Sheet'

const TIME_ZONE = 'Europe/Paris'
// Under this many plays a programme would be mostly empty sheets
const THRESHOLD = 10
// `wrapped.months` runs from December of the previous year to November
const MONTHS = ['décembre', 'janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre']

const number = new Intl.NumberFormat('fr-FR')
const plural = (count: number, one: string, many: string) => `${number.format(count)} ${count > 1 ? many : one}`
const today = () => new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', timeZone: TIME_ZONE })
// Month numbers in edition order, December first
const monthsOf = (months: number[]) => [...months].sort((a, b) => (a % 12) - (b % 12)).map((month) => MONTHS[month % 12]).join(', ')
const suffix = (rank: number) => rank === 1 ? 'er' : 'e'

type Art = (item: WrappedPoster, kind?: 'thumb' | 'art', width?: number) => string | undefined

export const Programme = ({ share, token }: { share: Share, token: string }) => {
  const { name, year, frozen, wrapped } = share
  const art: Art = (item, kind = 'thumb', width = 640) => item[kind]
    ? `/api/wrapped/share/${encodeURIComponent(token)}/images/${kind}?key=${encodeURIComponent(item.key)}&width=${width}`
    : undefined
  const short = wrapped.plays < THRESHOLD
  // 1 December at midnight in Paris: until the job freezes the edition, it is still closed
  const closed = frozen || Date.now() >= Date.UTC(year, 10, 30, 23)
  const lead = wrapped.palme || wrapped.grand_prix
  const shown = new Set(wrapped.top_shows.map(({ key }) => key))
  const cycles = wrapped.cycles.filter((cycle) => !(cycle.kind === 'show' && shown.has(cycle.key)))

  return (
    <main className="wall">
      <Opening name={name} year={year} posters={[...wrapped.top_movies, ...wrapped.top_shows].filter((item) => item.thumb).slice(0, 5)} art={art} />
      <Figures poster={lead} art={art} hours={wrapped.hours} plays={wrapped.plays} movies={wrapped.movies} shows={wrapped.shows} episodes={wrapped.episodes} />
      {!short && (
        <>
          {!!wrapped.top_movies.length && <Selection movies={wrapped.top_movies} art={art} />}
          {!!wrapped.top_shows.length && <Shows shows={wrapped.top_shows} art={art} />}
          {!!cycles.length && <Cycles cycles={cycles} art={art} />}
          <Year months={wrapped.months} posters={wrapped.month_posters} closed={closed} art={art} />
          {wrapped.night && <Night night={wrapped.night} art={art} />}
          <Profile wrapped={wrapped} art={art} />
          <Rank rank={wrapped.rank} users={wrapped.server.users} hours={wrapped.hours} />
          {wrapped.palme && (wrapped.grand_prix || wrapped.jury) && <Awards grandPrix={wrapped.grand_prix} jury={wrapped.jury} closed={closed} art={art} />}
          {lead && <Finale prize={wrapped.palme ? 'Palme d’or' : 'Grand Prix'} poster={lead} year={year} closed={closed} art={art} />}
        </>
      )}
      <Colophon year={year} closed={closed} short={short} />
    </main>
  )
}

const Opening = ({ name, year, posters, art }: { name: string, year: number, posters: WrappedPoster[], art: Art }) => {
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
      <div className="collage" data-count={posters.length}>
        {posters.map((poster, index) => (
          <Painted key={poster.key} className={`collage-${index}`} src={art(poster)} alt={poster.title} progress={progress} />
        ))}
      </div>
      <Lettering as="h1" className="opening-title" text={`Programme de ${name} ${year}`} highlight={name} />
      <p className="lede">Ce que tu as regardé sur le Plex de Thomas, du 1er&nbsp;décembre {year - 1} au 30&nbsp;novembre {year}.</p>
      <svg className="scroll-hint" viewBox="0 0 40 90" aria-hidden="true">
        <path d="M20 4 C 16 30, 25 52, 19 80 M8 64 C 13 72, 17 78, 19 84 C 23 76, 27 70, 33 62" />
      </svg>
    </Sheet>
  )
}

const Figures = ({ poster, art, hours, plays, movies, shows, episodes }: { poster: WrappedPoster | null, art: Art, hours: number, plays: number, movies: number, shows: number, episodes: number }) => {
  const sheet = useRef<HTMLElement>(null)
  const progress = useRevealProgress(sheet)

  return (
    <Sheet ref={sheet} className="sheet-figures" label="Chiffres" style={{ '--digits': String(Math.round(hours)).length } as React.CSSProperties}>
      {poster && <Painted className="figures-poster" src={art(poster)} alt={poster.title} progress={progress} />}
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
        <Brushed lines={['Sélection', 'officielle']} seed={3} />
        <ol className="selection-list">
          {movies.map((movie, rank) => <li key={movie.key}><SelectionEntry movie={movie} rank={rank + 1} art={art} progress={repaint} /></li>)}
        </ol>
      </Sheet>
    )
  }

  // The pinned sheet shows one poster at a time; the list gives assistive technologies all ten
  return (
    <div ref={track} className="track" style={{ '--steps': movies.length * 0.35 } as React.CSSProperties}>
      <Sheet className="sheet-selection" label="Sélection officielle">
        <Brushed lines={['Sélection', 'officielle']} seed={3} />
        <ol className="visually-hidden">
          {movies.map((movie, rank) => <li key={movie.key}>{rank + 1}. {movie.title}{movie.year ? `, ${movie.year}` : ''}</li>)}
        </ol>
        <div className="selection-stage" aria-hidden="true">
          <SelectionEntry movie={movies[index]} rank={index + 1} art={art} progress={repaint} />
        </div>
      </Sheet>
    </div>
  )
}

const SelectionEntry = ({ movie, rank, art, progress }: { movie: WrappedMovie, rank: number, art: Art, progress: MotionValue<number> }) => (
  <figure className="selection-entry">
    <div className="selection-frame">
      <Painted className="selection-poster" src={art(movie)} alt={movie.title} progress={progress} />
      <span className="selection-rank">{rank}</span>
    </div>
    <figcaption>
      <Lettering as="h3" className="selection-title" text={movie.title} seed={movie.title.length} />
      <p className="meta">{[movie.year, movie.plays > 1 && `vu ${movie.plays} fois`].filter(Boolean).join(' · ')}</p>
    </figcaption>
  </figure>
)

const Shows = ({ shows, art }: { shows: WrappedShow[], art: Art }) => {
  const sheet = useRef<HTMLElement>(null)
  const progress = useRevealProgress(sheet)
  const [first, ...others] = shows

  return (
    <Sheet ref={sheet} className="sheet-shows" label="Séries">
      <Brushed lines={['Tes séries']} seed={4} />
      <Painted className="show-lead" src={art(first, first.art ? 'art' : 'thumb', 1280)} alt={first.title} progress={progress} />
      <div>
        <Lettering as="h3" className="show-lead-title" text={first.title} seed={5} />
        <p className="meta">{plural(first.episodes, 'épisode', 'épisodes')}, en {monthsOf(first.months)}</p>
      </div>
      {!!others.length && (
        <ul className="show-others">
          {others.map((show) => (
            <li key={show.key}>
              <Painted className="show-other-poster" src={art(show, 'thumb', 320)} alt={show.title} progress={progress} />
              <span className="show-other-title">{show.title}</span>
              <span className="meta">{plural(show.episodes, 'épisode', 'épisodes')}, en {monthsOf(show.months)}</span>
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
      <Brushed lines={['Les cycles']} seed={6} />
      <p className="lede">Ce que tu as suivi sur plusieurs mois&#8239;: une série au long cours, un cinéaste dont tu as enchaîné les films.</p>
      <ol className="cycles">
        {cycles.map((cycle) => (
          <li key={`${cycle.kind}-${cycle.name}`} className="cycle">
            <Painted className="cycle-poster" src={art({ key: cycle.key, title: cycle.name, thumb: cycle.thumb }, 'thumb', 320)} alt={cycle.name} progress={progress} />
            <h3 className="cycle-name">{cycle.name}</h3>
            <p className="meta">
              {cycle.kind === 'show' ? plural(cycle.count, 'épisode', 'épisodes') : plural(cycle.count, 'film', 'films')}, en {monthsOf(cycle.months)}
            </p>
          </li>
        ))}
      </ol>
    </Sheet>
  )
}

// Each month is a strip of its most played poster, as tall as the hours it took
const Year = ({ months, posters, closed, art }: { months: number[], posters: (WrappedPoster | null)[], closed: boolean, art: Art }) => {
  const reduced = useReducedMotion()
  const track = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: track, offset: ['start start', 'end end'] })
  const repaint = useTransform(scrollYProgress, [0, 0.7], [0, 1], { clamp: true })
  const month = new Date().toLocaleDateString('en-US', { month: 'numeric', timeZone: TIME_ZONE })
  const elapsed = closed ? 12 : (Number(month) % 12) + 1
  const max = Math.max(...months, 1)
  const peak = months.indexOf(Math.max(...months))

  const compose = useCallback(async (boxWidth: number, boxHeight: number) => {
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(boxWidth)
    canvas.height = Math.round(boxHeight)
    const context = canvas.getContext('2d') as CanvasRenderingContext2D
    const width = canvas.width / 12

    await Promise.all(posters.slice(0, elapsed).map((poster, index) => new Promise<void>((resolve) => {
      const src = poster && months[index] > 0 && art(poster, 'thumb', 320)

      if (!src) {
        return resolve()
      }

      const image = new Image()
      image.onload = () => {
        const height = Math.max(24, (months[index] / max) * canvas.height)
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
  }, [posters, months, elapsed])

  return (
    <div ref={track} className="track" style={{ '--steps': reduced ? 0 : 1 } as React.CSSProperties}>
      <Sheet className="sheet-year" label="L’année mois par mois">
        <Brushed lines={['L’année,', 'mois par mois']} seed={7} />
        <Painted
          className="year-strips"
          compose={compose}
          alt={months.slice(0, elapsed).map((hours, index) => `${MONTHS[index]} ${number.format(hours)} h`).join(', ')}
          progress={repaint}
        />
        <ol className="year-months" aria-hidden="true">
          {MONTHS.map((name, index) => <li key={name} className={index >= elapsed ? 'year-month-future' : undefined}>{name[0]}</li>)}
        </ol>
        {months[peak] > 0 && (
          <p className="year-peak">
            <span className="year-peak-month">{MONTHS[peak]}</span>, ton mois le plus chargé&#8239;: {number.format(months[peak])}&nbsp;h{posters[peak] ? `, surtout ${posters[peak]!.title}` : ''}
          </p>
        )}
      </Sheet>
    </div>
  )
}

const Night = ({ night, art }: { night: NonNullable<Share['wrapped']['night']>, art: Art }) => {
  const sheet = useRef<HTMLElement>(null)
  const progress = useRevealProgress(sheet)
  const date = new Date(`${night.date}T12:00:00Z`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TIME_ZONE })
  const poster = night.poster

  return (
    <Sheet ref={sheet} className="sheet-night" label="Ton plus long marathon">
      <Painted className="night-poster" src={art(poster, poster.thumb ? 'thumb' : 'art', 1280)} alt={poster.title} progress={progress} />
      <div className="night-text">
        <Brushed lines={['Ton plus long', 'marathon']} seed={8} />
        <p className="night-date">{date}</p>
        <p className="night-figures">
          {night.episodes ? plural(night.episodes, 'épisode', 'épisodes') : plural(night.plays, 'séance', 'séances')} d’affilée, jusqu’à <strong>{night.end.replace(/^0?(\d+):/, '$1 h ')}</strong>
        </p>
        <ul className="night-titles">
          {night.titles.map((title) => <li key={title}>{title}</li>)}
        </ul>
      </div>
    </Sheet>
  )
}

const Profile = ({ wrapped, art }: { wrapped: Share['wrapped'], art: Art }) => {
  const sheet = useRef<HTMLElement>(null)
  const progress = useRevealProgress(sheet)
  const lines = [
    wrapped.decade && ['Ta décennie', `les années ${wrapped.decade}`],
    wrapped.genre && ['Ton genre', wrapped.genre],
    wrapped.director && ['Ton cinéaste', wrapped.director],
    wrapped.film_age && ['Tes films sortent en moyenne en', String(wrapped.film_age)],
    wrapped.movies > 0 && ['Vus par personne d’autre sur le serveur', `${wrapped.only_you_pct} % de tes films`],
  ].filter(Boolean) as [string, string][]

  if (!lines.length) {
    return null
  }

  return (
    <Sheet ref={sheet} className="sheet-profile" label="Ton profil">
      <Brushed lines={['Ton profil']} seed={9} />
      {!!wrapped.director_movies.length && (
        <div className="profile-posters" data-count={wrapped.director_movies.length}>
          {wrapped.director_movies.map((movie) => (
            <Painted key={movie.key} className="profile-poster" src={art(movie, 'thumb', 320)} alt={movie.title} progress={progress} />
          ))}
        </div>
      )}
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

const Rank = ({ rank, users, hours }: { rank: number, users: number, hours: number }) => (
  <Sheet className="sheet-rank" label="Ton rang">
    <p className="rank" aria-label={`${rank}${suffix(rank)} sur ${users}`}>
      <span aria-hidden="true">{rank}<sup>{suffix(rank)}</sup></span>
    </p>
    <Lettering text={`sur ${users} spectateurs`} seed={11} />
    <ol className="crowd" aria-hidden="true">
      {Array.from({ length: users }, (_, index) => <li key={index} className={index === rank - 1 ? 'crowd-you' : undefined} />)}
    </ol>
    <p className="rank-detail">Tu as passé {plural(hours, 'heure', 'heures')} au cinéma de Thomas. Chaque trait est un spectateur, classé aux heures regardées, sans nom.</p>
  </Sheet>
)

const Awards = ({ grandPrix, jury, closed, art }: { grandPrix: WrappedShow | null, jury: WrappedMovie | null, closed: boolean, art: Art }) => {
  const sheet = useRef<HTMLElement>(null)
  const progress = useRevealProgress(sheet)
  const awards = [
    grandPrix && ['Grand Prix', 'la série que tu as le plus suivie', grandPrix],
    jury && ['Prix du jury', 'le plus ancien des films que personne d’autre n’a vus sur le serveur', jury],
  ].filter(Boolean) as [string, string, WrappedPoster][]

  return (
    <Sheet ref={sheet} className="sheet-awards" label="Palmarès">
      <Brushed lines={['Palmarès']} seed={10} />
      <ol className="awards" data-count={awards.length}>
        {awards.map(([prize, reason, item]) => (
          <li key={prize} className="award">
            <Painted className="award-poster" src={art(item, 'thumb', 640)} alt={item.title} progress={progress} />
            <h3 className="award-prize">{prize}</h3>
            <p className="award-title">{item.title}</p>
            <p className="meta">{reason}</p>
          </li>
        ))}
      </ol>
      <p className="awards-next">Et la Palme d’or…</p>
      {!closed && <p className="stamp">Provisoire</p>}
    </Sheet>
  )
}

const Finale = ({ prize, poster, year, closed, art }: { prize: string, poster: WrappedPoster, year: number, closed: boolean, art: Art }) => {
  const sheet = useRef<HTMLElement>(null)
  const progress = useRevealProgress(sheet)

  return (
    <Sheet ref={sheet} className="sheet-finale" label={`${prize} ${year}`}>
      <Painted className="finale-poster" src={art(poster, 'thumb', 1280)} alt={poster.title} progress={progress} />
      <div className="finale-text">
        <Brushed lines={[`${prize} ${year}`]} seed={12} />
        <Lettering as="p" className="finale-title" text={poster.title} seed={13} />
        {!closed && <p className="stamp stamp-finale">Provisoire</p>}
        <p className="finale-end">Fin.</p>
        <p className="finale-next">À l’année prochaine.</p>
      </div>
    </Sheet>
  )
}

const Colophon = ({ year, closed, short }: { year: number, closed: boolean, short: boolean }) => (
  <footer className="colophon">
    {short && <p className="colophon-short">Ton programme se remplit à chaque séance&#8239;: reviens le voir dans l’année.</p>}
    <p>{closed ? `Programme ${year}, clôturé le 1er décembre ${year}.` : `Programme au ${today()}, clôture le 1er décembre ${year}.`}</p>
  </footer>
)
