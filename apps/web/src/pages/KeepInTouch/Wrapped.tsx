import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Bar } from '@sensorr/ui'
import { WRAPPED_LOOKS, WrappedLook } from '@sensorr/sensorr'
import i18n from '@sensorr/i18n'

const WALL = 48
const ENTRANCE = 'cubic-bezier(0.16, 1, 0.3, 1)'

const linkOf = (token) => new URL(`wrapped/${token}`, document.baseURI).href
const imageOf = (token, key) => `/api/wrapped/share/${encodeURIComponent(token)}/images/thumb?key=${encodeURIComponent(key)}&width=320`
export const lookOf = (theme): WrappedLook => WRAPPED_LOOKS[theme] || WRAPPED_LOOKS.tele

// Every title of the wrapped that has a poster, once
const postersOf = (value, found = new Map()) => {
  if (Array.isArray(value)) {
    value.forEach((item) => postersOf(item, found))
  } else if (value && typeof value === 'object') {
    if (typeof value.key === 'string' && value.thumb && !found.has(value.key)) {
      found.set(value.key, value)
    }

    Object.values(value).forEach((item) => postersOf(item, found))
  }

  return [...found.values()]
}

// What the wrapped page itself reads; `null` while it loads, and when it cannot open
export const useShare = (token) => {
  const [share, setShare] = useState(null)

  useEffect(() => {
    if (!token) {
      return
    }

    const controller = new AbortController()
    fetch(`/api/wrapped/share/${encodeURIComponent(token)}`, { signal: controller.signal, headers: { Accept: 'application/json' } })
      .then((res) => res.ok ? res.json() : null)
      .then((body) => setShare(body && { ...body, posters: postersOf(body.wrapped) }))
      .catch(() => null)

    return () => controller.abort()
  }, [token])

  return share
}

// The display face of the look, served by the wrapped app next to this one
const fontFaceOf = ({ display }: WrappedLook) => `@font-face { font-family: ${display.family.split(',')[0]}; font-weight: ${display.weight}; font-style: ${display.italic ? 'italic' : 'normal'}; font-display: swap; src: url('${new URL(`wrapped/assets/fonts/${display.file}`, document.baseURI).href}') format('woff2'); }`

export const LookFont = ({ look }: { look: WrappedLook }) => <style>{fontFaceOf(look)}</style>

const displayOf = (look: WrappedLook) => ({
  fontFamily: look.display.family,
  fontWeight: look.display.weight,
  fontStyle: look.display.italic ? 'italic' : 'normal',
  color: look.display.color,
  lineHeight: 1,
})

// The wall of the splash, made of the friend's own posters under the colour of their look
export const WrappedWall = ({ token, share, look }) => {
  const tiles = share.posters.length ? Array.from({ length: WALL }, (_, index) => share.posters[index % share.posters.length]) : []

  return (
    <div sx={WrappedWall.styles.element} aria-hidden={true}>
      <div sx={WrappedWall.styles.grid}>
        {tiles.map((poster, index) => (
          <img
            key={index}
            src={imageOf(token, poster.key)}
            alt=''
            decoding='async'
            sx={WrappedWall.styles.tile}
            style={{ animationDelay: `${(index % 12) * 60}ms` }}
          />
        ))}
      </div>
      <div sx={{ ...WrappedWall.styles.veil, backgroundColor: look.ground }} />
    </div>
  )
}

WrappedWall.styles = {
  element: {
    position: 'absolute',
    inset: '0px',
    zIndex: -1,
    overflow: 'hidden',
    animation: 'wall-in 1200ms ease-out both',
    '@keyframes wall-in': {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
    '@media (prefers-reduced-motion: reduce)': {
      animation: 'none',
    },
  },
  grid: {
    position: 'absolute',
    width: '200%',
    height: '200%',
    top: '-50%',
    left: '-50%',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(8em, 1fr))',
    gap: '0.5em',
    transform: 'rotate(30deg)',
  },
  tile: {
    width: '100%',
    aspectRatio: '2 / 3',
    objectFit: 'cover',
    animation: `tile-in 900ms ${ENTRANCE} both`,
    '@keyframes tile-in': {
      from: { opacity: 0, transform: 'translateY(3em)' },
      to: { opacity: 1, transform: 'translateY(0)' },
    },
    '@media (prefers-reduced-motion: reduce)': {
      animation: 'none',
    },
  },
  veil: {
    position: 'absolute',
    inset: '0px',
    opacity: 0.72,
  },
}

// Takes the place of the Plex + sensorr emblem once the wall is the friend's
export const WrappedTitle = ({ token, share, look }) => {
  const { t } = useTranslation()

  return (
    <div sx={WrappedTitle.styles.element}>
      <h2 sx={{ ...displayOf(look), ...WrappedTitle.styles.title }}>{t('wrapped.title', { name: share.name, year: share.year })}</h2>
      <a href={linkOf(token)} target='_blank' rel='noopener noreferrer' sx={{ ...WrappedTitle.styles.action, backgroundColor: look.button.background, color: look.button.color }}>
        {t('keepInTouch.done.wrapped.explore')}
      </a>
    </div>
  )
}

WrappedTitle.styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    margin: 'auto',
    maxWidth: '20em',
    textAlign: 'center',
    animation: `title-in 900ms ${ENTRANCE} 500ms both`,
    '@keyframes title-in': {
      from: { opacity: 0, transform: 'translateY(1em)' },
      to: { opacity: 1, transform: 'translateY(0)' },
    },
    '@media (prefers-reduced-motion: reduce)': {
      animation: 'none',
    },
  },
  label: {
    fontFamily: 'monospace',
    fontSize: 6,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
  },
  title: {
    margin: '0px',
    fontSize: ['2.25em', '3em'],
    textWrap: 'balance',
  },
  action: {
    variant: 'button.default',
    textDecoration: 'none',
    borderColor: 'transparent',
    marginTop: 4,
    ':hover': {
      filter: 'brightness(1.1)',
    },
  },
}

// The opening story of their wrapped, in an object of the look, with the ways back to it
export const WrappedTicket = ({ token, share, look }) => {
  const { t } = useTranslation()
  const [card, setCard] = useState('loading')
  const href = linkOf(token)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(href)
      toast.success(t('keepInTouch.done.wrapped.copied'))
    } catch (err) {
      toast.error(t('keepInTouch.done.wrapped.uncopied'))
    }
  }

  return (
    <div sx={WrappedTicket.styles.element}>
      <div sx={{ ...WrappedTicket.styles.ticket, backgroundColor: look.ground, color: look.ink }}>
        <Edge look={look} />
        <div sx={WrappedTicket.styles.body}>
          {card !== 'failed' && (
            <a href={href} target='_blank' rel='noopener noreferrer' sx={WrappedTicket.styles.card} tabIndex={-1} aria-hidden={true}>
              {card === 'loading' && <Bar width='100%' height='100%' sx={WrappedTicket.styles.skeleton} />}
              <img
                src={`/api/wrapped/share/${encodeURIComponent(token)}/cards/${share.look.theme}/opening?lang=${i18n.language}`}
                alt=''
                onLoad={() => setCard('loaded')}
                onError={() => setCard('failed')}
                sx={{ ...WrappedTicket.styles.image, opacity: card === 'loaded' ? 1 : 0 }}
              />
            </a>
          )}
          <div sx={WrappedTicket.styles.text}>
            <span sx={{ ...WrappedTitle.styles.label, color: look.label }}>{t('mail.wrapped.band')} {share.year}</span>
            <h3 sx={{ ...displayOf(look), ...WrappedTicket.styles.title }}>{t('mail.wrapped.title', { open: share.frozen ? 'no' : 'yes' })}</h3>
            <a href={href} target='_blank' rel='noopener noreferrer' sx={{ ...WrappedTitle.styles.action, marginTop: 2, backgroundColor: look.button.background, color: look.button.color }}>
              {t('keepInTouch.done.wrapped.open')}
            </a>
            <button type='button' onClick={copy} sx={{ ...WrappedTicket.styles.copy, color: look.ink }}>
              {t('keepInTouch.done.wrapped.copy')}
            </button>
          </div>
        </div>
        <Edge look={look} />
      </div>
      <p sx={WrappedTicket.styles.keep}>
        {t('keepInTouch.done.wrapped.keep')}
      </p>
    </div>
  )
}

WrappedTicket.styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    marginY: 2,
  },
  ticket: {
    width: '100%',
    maxWidth: '30em',
    textAlign: 'left',
  },
  body: {
    display: 'flex',
    flexDirection: ['column', 'row'],
    alignItems: 'center',
    gap: 2,
    padding: '1.5em',
  },
  card: {
    position: 'relative',
    flexShrink: 0,
    display: 'block',
    height: '14em',
    aspectRatio: '9 / 16',
    transform: 'rotate(-3deg)',
    transition: `transform 400ms ${ENTRANCE}`,
    '@media (hover: hover)': {
      ':hover': {
        transform: 'rotate(0deg) scale(1.04)',
      },
    },
    '@media (prefers-reduced-motion: reduce)': {
      transition: 'none',
    },
  },
  skeleton: {
    position: 'absolute',
    inset: '0px',
  },
  image: {
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'opacity 400ms ease-out',
  },
  text: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: ['center', 'flex-start'],
    textAlign: ['center', 'left'],
    gap: 8,
  },
  title: {
    margin: '0px',
    fontSize: ['1.5em', '2em'],
    textWrap: 'balance',
  },
  copy: {
    variant: 'link.reset',
    padding: '0.5em 0px',
    border: 'none',
    background: 'none',
    fontSize: 6,
    textDecoration: 'underline',
    textUnderlineOffset: '0.2em',
    cursor: 'pointer',
  },
  keep: {
    margin: '0px',
    maxWidth: '26em',
    fontSize: 6,
    lineHeight: 'body',
  },
}

// The edge of the object: film perforations for the labo look, the band of colours of the others
const Edge = ({ look }: { look: WrappedLook }) => look.stripe ? (
  <div sx={{ display: 'flex', height: '0.5em' }}>
    {look.stripe.map((color, index) => <span key={index} sx={{ flex: 1, backgroundColor: color }} />)}
  </div>
) : look === WRAPPED_LOOKS.labo ? (
  <div sx={{ height: '1.25em', backgroundColor: '#1d130c', backgroundImage: 'repeating-linear-gradient(90deg, transparent 0 0.5em, #f6ecd8 0.5em 1.1em, transparent 1.1em 1.6em)', backgroundSize: '100% 0.5em', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} />
) : null
