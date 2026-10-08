import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Bar } from '@sensorr/ui'
import { WRAPPED_LOOKS, WrappedLook } from '@sensorr/sensorr'
import i18n from '@sensorr/i18n'
import { useDevice } from '@sensorr/utils'

const ENTRANCE = 'cubic-bezier(0.16, 1, 0.3, 1)'

const linkOf = (token) => new URL(`wrapped/${token}`, document.baseURI).href
export const lookOf = (theme): WrappedLook => WRAPPED_LOOKS[theme] || WRAPPED_LOOKS.tele

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
      .then(setShare)
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

const labelStyle = {
  fontFamily: 'monospace',
  fontSize: 6,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
}

// A button in the colours of the look, which `sx` merges with them
const actionStyle = {
  variant: 'button.default',
  textDecoration: 'none',
  borderColor: 'transparent',
  marginTop: 4,
  ':hover': {
    filter: 'brightness(1.1)',
  },
}

// The opening of their wrapped, in its look, takes the place of the splash once it has loaded
export const WrappedPage = ({ token, look }) => {
  const { t } = useTranslation()
  const [loaded, setLoaded] = useState(false)

  return (
    <div sx={{ ...WrappedPage.styles.element, backgroundColor: look.ground }} data-loaded={loaded}>
      <iframe src={`${linkOf(token)}?cover`} title={t('keepInTouch.done.wrapped.open')} tabIndex={-1} onLoad={() => setLoaded(true)} sx={WrappedPage.styles.frame} />
      <a href={linkOf(token)} target='_blank' rel='noopener noreferrer' aria-label={t('keepInTouch.done.wrapped.open')} sx={WrappedPage.styles.link} />
    </div>
  )
}

WrappedPage.styles = {
  element: {
    position: 'absolute',
    inset: '0px',
    zIndex: 1,
    clipPath: 'inset(0 0 0 100%)',
    transition: `clip-path 1200ms ${ENTRANCE}`,
    '&[data-loaded="true"]': {
      clipPath: 'inset(0 0 0 0)',
    },
    '@media (prefers-reduced-motion: reduce)': {
      transition: 'none',
    },
  },
  frame: {
    display: 'block',
    width: '100%',
    height: '100%',
    border: 'none',
    pointerEvents: 'none',
  },
  // The whole presentation opens the wrapped
  link: {
    position: 'absolute',
    inset: '0px',
    cursor: 'pointer',
  },
}

// The opening story of their wrapped, in an object of the look, with the ways back to it
export const WrappedTicket = ({ token, share, look }) => {
  const { t } = useTranslation()
  const [card, setCard] = useState('loading')
  const href = linkOf(token)
  // Beside the page their wrapped already fills, the story would show it twice
  const beside = useDevice() !== 'mobile'

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
          {!beside && card !== 'failed' && (
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
            <span sx={{ ...labelStyle, color: look.label }}>{t('mail.wrapped.band')} {share.year}</span>
            <h3 sx={{ ...displayOf(look), ...WrappedTicket.styles.title }}>{t('mail.wrapped.title', { open: share.frozen ? 'no' : 'yes' })}</h3>
            <a href={href} target='_blank' rel='noopener noreferrer' sx={{ ...actionStyle, marginTop: 2, backgroundColor: look.button.background, color: look.button.color }}>
              {t('keepInTouch.done.wrapped.open')}
            </a>
            <button type='button' onClick={copy} sx={{ ...WrappedTicket.styles.copy, color: look.ink }}>
              {t('keepInTouch.done.wrapped.copy')}
            </button>
          </div>
        </div>
        <p sx={{ ...WrappedTicket.styles.keep, borderColor: look.label }}>
          {t('keepInTouch.done.wrapped.keep')}
        </p>
        <Edge look={look} />
      </div>
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
    maxWidth: '32em',
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
    height: '16em',
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
    fontSize: ['1.25em', '1.5em'],
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
  // Below a tear line, as the stub of a ticket
  keep: {
    margin: '0px',
    padding: '1em 1.5em',
    borderTop: '1px dashed',
    fontSize: 6,
    lineHeight: 'body',
    textAlign: ['center', 'left'],
  },
}

// The edge of the object: film perforations for the labo look, the band of colours of the others
const Edge = ({ look }: { look: WrappedLook }) => look.stripe ? (
  <div sx={{ display: 'flex', height: '0.5em' }}>
    {look.stripe.filter((color) => color !== look.ground).map((color, index) => <span key={index} sx={{ flex: 1, backgroundColor: color }} />)}
  </div>
) : look === WRAPPED_LOOKS.labo ? (
  <div sx={{ height: '1.25em', backgroundColor: '#1d130c', backgroundImage: 'repeating-linear-gradient(90deg, transparent 0 0.5em, #f6ecd8 0.5em 1.1em, transparent 1.1em 1.6em)', backgroundSize: '100% 0.5em', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} />
) : null
