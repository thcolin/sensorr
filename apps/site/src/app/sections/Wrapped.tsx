import { useEffect, useRef, useState } from 'react'
import { buttonStyles } from '@sensorr/ui'
import { WRAPPED } from '../data'

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'
// The demo's only wrapped is Alex's, `/wrapped/demo`, and apps/wrapped/src/app/look.ts keeps the friend's look under this key
const LOOK_KEY = 'wrapped-look:demo'

type Crop = { x: number, y: number, w: number, h: number }

// The five looks of apps/wrapped, the middle one on top. x and y in % of the fan's width, r in degrees at full spread,
// w the cover's width, d when it starts to deal (center first, outer last). Crops cut each 1200×692 capture down to
// the object itself, in capture pixels: [phone, fan]. The phone row keeps a portrait detail, the fan the whole object.
// glow: two colors picked in each capture, laid behind the fan while that look is lifted
const LOOKS = [
  {
    id: 'tele', name: 'TV Guide', x: 0, y: -2, r: -1.5, rm: -1.5, z: 5, w: 38, d: 0,
    crop: [{ x: 66, y: 28, w: 534, h: 664 }, { x: 66, y: 28, w: 1068, h: 664 }],
    glow: ['hsl(2, 78%, 52%)', 'hsl(46, 95%, 58%)'],
  },
  {
    id: 'labo', name: '35mm Lab', x: -22, y: 1, r: -5, rm: 2, z: 4, w: 22, d: 0.12,
    crop: [{ x: 300, y: 0, w: 600, h: 692 }, { x: 300, y: 0, w: 600, h: 692 }],
    glow: ['hsl(14, 82%, 56%)', 'hsl(36, 60%, 78%)'],
  },
  {
    id: 'videoclub', name: 'Video Store', x: 22, y: 2, r: 4.5, rm: -2, z: 4, w: 27, d: 0.12,
    crop: [{ x: 330, y: 20, w: 540, h: 672 }, { x: 190, y: 0, w: 820, h: 692 }],
    glow: ['hsl(268, 70%, 48%)', 'hsl(186, 90%, 62%)'],
  },
  {
    id: 'scenario', name: 'Screenplay', x: -37, y: 5, r: -7, rm: 1.5, z: 3, w: 22, d: 0.24,
    crop: [{ x: 285, y: 20, w: 680, h: 672 }, { x: 285, y: 20, w: 680, h: 672 }],
    glow: ['hsl(40, 35%, 82%)', 'hsl(54, 92%, 58%)'],
  },
  {
    id: 'affiche', name: 'Polish Poster', x: 37, y: 6, r: 6, rm: -1.5, z: 3, w: 22, d: 0.24,
    crop: [{ x: 305, y: 160, w: 518, h: 532 }, { x: 305, y: 200, w: 518, h: 492 }],
    glow: ['hsl(4, 72%, 50%)', 'hsl(38, 45%, 52%)'],
  },
] as const

type Look = typeof LOOKS[number]['id']

// The capture, scaled and shifted so only the crop shows through its frame
const cropOf = ({ x, y, w, h }: Crop) => ({
  aspectRatio: `${w} / ${h}`,
  img: { width: `${(1200 / w) * 100}%`, left: `${(-x / w) * 100}%`, top: `${(-y / h) * 100}%` },
})

// 0 when the fan's top meets the bottom of the viewport, 1 once it stands at 35% of its height
const useSpread = () => {
  const ref = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const element = ref.current

    if (!element) {
      return
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      element.style.setProperty('--spread', '1')
      return
    }

    let frame = 0
    const measure = () => {
      frame = 0
      const { top } = element.getBoundingClientRect()
      const progress = (window.innerHeight - top) / (window.innerHeight * 0.65)
      element.style.setProperty('--spread', Math.min(1, Math.max(0, progress)).toFixed(3))
    }
    const schedule = () => {
      frame ||= requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      cancelAnimationFrame(frame)
    }
  }, [])

  return ref
}

// On the phone the row scrolls: the cover snapped in the middle is the one the glow and the dots follow
const useSnapped = (ref: React.RefObject<HTMLUListElement | null>) => {
  const [snapped, setSnapped] = useState<Look | null>(null)

  useEffect(() => {
    const row = ref.current

    if (!row) {
      return
    }

    const observer = new IntersectionObserver((entries) => {
      // The fan does not scroll, every cover intersects it
      if (getComputedStyle(row).overflowX !== 'auto') {
        return
      }

      const entry = entries.find((entry) => entry.isIntersecting)
      entry && setSnapped((entry.target as HTMLElement).dataset.look as Look)
    }, { root: row, threshold: 0.6 })

    Array.from(row.children).forEach((child) => observer.observe(child))
    return () => observer.disconnect()
  }, [ref])

  return snapped
}

const choose = (id: Look | null) => {
  try {
    id ? window.localStorage.setItem(LOOK_KEY, id) : window.localStorage.removeItem(LOOK_KEY)
  } catch {
    // Blocked storage: the wrapped opens in its default look
  }
}

export const Wrapped = () => {
  const ref = useSpread()
  const snapped = useSnapped(ref)
  const [lifted, setLifted] = useState<Look | null>(null)
  const active = lifted ?? snapped ?? 'tele'

  return (
    <section aria-labelledby='wrapped' sx={Wrapped.styles.element}>
      <div sx={Wrapped.styles.stage} aria-hidden='true'>
        <div sx={Wrapped.styles.wall}>
          {LOOKS.map(({ id }) => (
            <img key={id} src={`assets/wrapped/${id}.webp`} alt='' loading='lazy' decoding='async' sx={Wrapped.styles.blur} />
          ))}
        </div>
        {LOOKS.map(({ id, glow: [one, two] }) => (
          <div
            key={id}
            sx={Wrapped.styles.glow}
            style={{
              backgroundImage: `radial-gradient(ellipse 40% 45% at 36% 60%, ${one} 0%, transparent 100%), radial-gradient(ellipse 40% 45% at 64% 66%, ${two} 0%, transparent 100%)`,
              opacity: active === id ? 0.7 : 0,
            }}
          />
        ))}
      </div>
      <div sx={Wrapped.styles.text}>
        <p sx={Wrapped.styles.label}><span aria-hidden='true'>📖</span> Wrapped</p>
        <h2 id='wrapped' sx={Wrapped.styles.title}>A wrapped for every friend, every year.</h2>
        <p sx={Wrapped.styles.body}>
          Tautulli's watch history gives each friend a wrapped of their year on your server, in five looks, in English and French.
        </p>
      </div>
      <ul ref={ref} sx={Wrapped.styles.fan} onMouseLeave={() => setLifted(null)}>
        {LOOKS.map(({ id, name, x, y, r, rm, z, w, d, crop: [phone, fan] }) => {
          const [small, large] = [cropOf(phone), cropOf(fan)]

          return (
            <li
              key={id}
              data-look={id}
              sx={Wrapped.styles.item}
              data-lifted={lifted === id || undefined}
              style={{ '--x': `${x}cqw`, '--y': `${y}cqw`, '--r': `${r}deg`, '--rm': `${rm}deg`, '--z': z, '--w': `${w}cqw`, '--d': d } as React.CSSProperties}
            >
              <a
                href={WRAPPED}
                sx={Wrapped.styles.cover}
                onClick={() => choose(id)}
                onMouseEnter={() => setLifted(id)}
                onFocus={() => setLifted(id)}
                onBlur={() => setLifted(null)}
              >
                <span sx={{ ...Wrapped.styles.frame, aspectRatio: [small.aspectRatio, large.aspectRatio] }}>
                  <img
                    src={`assets/wrapped/${id}.webp`}
                    alt={`Alex's wrapped in the ${name} look`}
                    width={1200}
                    height={692}
                    loading='lazy'
                    decoding='async'
                    sx={{
                      ...Wrapped.styles.picture,
                      width: [small.img.width, large.img.width],
                      left: [small.img.left, large.img.left],
                      top: [small.img.top, large.img.top],
                    }}
                  />
                </span>
                <span sx={Wrapped.styles.name} aria-hidden='true'>{name}</span>
              </a>
            </li>
          )
        })}
      </ul>
      <div sx={Wrapped.styles.dots} aria-hidden='true'>
        {LOOKS.map(({ id }) => (
          <span key={id} sx={Wrapped.styles.dot} data-active={(snapped ?? 'tele') === id || undefined} />
        ))}
      </div>
      <div sx={Wrapped.styles.actions}>
        <a href={WRAPPED} onClick={() => choose(null)} sx={{ ...buttonStyles.contain({ color: 'white' }), ...Wrapped.styles.action }}>
          Read Alex's wrapped
        </a>
      </div>
    </section>
  )
}

const ring = {
  ':focus-visible': {
    outline: '2px solid',
    outlineColor: 'primary',
    outlineOffset: '2px',
  },
}

const decorative = {
  '@media (prefers-reduced-motion: reduce)': {
    transition: 'none',
  },
}

// How far a cover has been dealt, 0 to 1, from the fan's --spread and the cover's own --d
const dealt = 'clamp(0, calc((var(--spread) - var(--d)) / 0.76), 1)'

Wrapped.styles = {
  element: {
    position: 'relative',
    isolation: 'isolate',
    display: 'flex',
    flexDirection: 'column',
    alignItems: ['stretch', 'center'],
    gap: [2, 0],
    paddingTop: [3, 1],
    paddingBottom: 4,
    overflow: 'hidden',
    // Its own floor, so nothing from the section above shows under the glow
    backgroundColor: 'white',
  },
  stage: {
    position: 'absolute',
    inset: '0px',
    zIndex: -1,
    pointerEvents: 'none',
    '::after': {
      content: '""',
      position: 'absolute',
      inset: '0px',
      // Melts the glow into the page above and below
      background: 'linear-gradient(to bottom, var(--theme-ui-colors-white) 0%, transparent 12%, transparent 88%, var(--theme-ui-colors-white) 100%)',
    },
  },
  wall: {
    position: 'absolute',
    inset: '0px',
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    opacity: 0.3,
  },
  blur: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    filter: 'blur(48px) saturate(1.4)',
    transform: 'scale(1.3)',
  },
  glow: {
    position: 'absolute',
    inset: '0px',
    mixBlendMode: 'screen',
    transition: `opacity 700ms ${EASE}`,
    ...decorative,
  },
  text: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: ['flex-start', 'center'],
    gap: 6,
    width: '100%',
    maxWidth: '72em',
    marginX: 'auto',
    paddingX: [4, 2],
    textAlign: ['left', 'center'],
  },
  label: {
    margin: '0px',
    fontSize: 6,
    fontWeight: 'semibold',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'textLight',
  },
  title: {
    margin: '0px',
    fontFamily: 'heading',
    fontWeight: 800,
    fontSize: 'clamp(2.5rem, 6vw, 5.5rem)',
    lineHeight: 1.05,
    letterSpacing: '-0.02em',
    textWrap: 'balance',
    color: 'text',
  },
  body: {
    margin: '0px',
    maxWidth: '36em',
    fontSize: [3, 2],
    lineHeight: 'body',
    color: 'textLight',
    textWrap: 'balance',
  },
  fan: {
    '--spread': 0,
    position: 'relative',
    // 3em of air on each side, so a tilted outer cover and its focus ring stay inside the viewport
    width: ['100%', 'calc(100% - 6em)'],
    maxWidth: '100em',
    margin: '0px',
    padding: '0px',
    listStyle: 'none',
    // The phone row scrolls from cover to cover, the fan lays them on one table
    display: ['flex', 'block'],
    alignItems: 'center',
    gap: 4,
    overflowX: ['auto', 'visible'],
    scrollSnapType: 'x mandatory',
    scrollPaddingX: '14vw',
    paddingX: ['14vw', '0px'],
    paddingY: [2, '0px'],
    scrollbarWidth: 'none',
    containerType: 'inline-size',
    aspectRatio: ['auto', '100 / 40'],
  },
  item: {
    '--s': dealt,
    flexShrink: 0,
    width: ['72vw', 'var(--w)'],
    position: ['relative', 'absolute'],
    top: [null, '46%'],
    left: [null, '50%'],
    zIndex: 'var(--z)',
    scrollSnapAlign: 'center',
    // Dealt like cards: from a pile in the middle, each to its place on the table
    transform: [
      'rotate(var(--rm))',
      'translate(-50%, -50%) translate(calc(var(--x) * (0.12 + 0.88 * var(--s))), calc(var(--y) * var(--s) + 6cqw * (1 - var(--s)))) rotate(calc(var(--r) * var(--s)))',
    ],
    transition: `transform 600ms ${EASE}`,
    '&[data-lifted]': {
      zIndex: 10,
      transform: [
        'rotate(0deg)',
        'translate(-50%, -50%) translate(calc(var(--x) * 0.85 * (0.12 + 0.88 * var(--s))), calc(var(--y) * var(--s) - 1.5cqw)) rotate(0deg) scale(1.04)',
      ],
    },
    ...decorative,
  },
  cover: {
    display: 'block',
    borderRadius: '0.25em',
    textDecoration: 'none',
    ...ring,
  },
  frame: {
    display: 'block',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '0.25em',
    backgroundColor: 'grayDark',
  },
  picture: {
    display: 'block',
    position: 'absolute',
    maxWidth: 'none',
    height: 'auto',
  },
  name: {
    display: 'block',
    width: 'fit-content',
    marginTop: 8,
    marginX: 'auto',
    paddingX: 8,
    borderRadius: '1em',
    backgroundColor: 'blackShadow',
    fontFamily: 'monospace',
    fontSize: [5, 4],
    whiteSpace: 'nowrap',
    color: 'text',
    textAlign: 'center',
    transition: `background-color 400ms ${EASE}, color 400ms ${EASE}`,
    '[data-lifted] &': {
      backgroundColor: 'text',
      color: 'white',
    },
    ...decorative,
  },
  dots: {
    display: ['flex', 'none'],
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: '0.5em',
    height: '0.5em',
    borderRadius: '1em',
    backgroundColor: 'textLight',
    opacity: 0.35,
    transition: `opacity 400ms ${EASE}, width 400ms ${EASE}`,
    '&[data-active]': {
      width: '1.5em',
      opacity: 1,
    },
    ...decorative,
  },
  actions: {
    display: 'flex',
    justifyContent: ['flex-start', 'center'],
    marginTop: '0px',
    paddingX: [4, 2],
  },
  action: {
    display: 'inline-block',
    fontSize: [4, 3],
    paddingX: 0,
    paddingY: 6,
    color: 'blackPure',
    textDecoration: 'none',
    ...ring,
  },
}
