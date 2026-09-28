import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import usePortal from 'react-useportal'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { Button, Icon, Pane, Picture } from '@sensorr/ui'
import { useAPI } from '../../store/api'
import { useTMDB } from '../../store/tmdb'
import { artworkOf } from '../../store/plex'
import { useMoviesMetadataContext } from '../../contexts/MoviesMetadata/MoviesMetadata'
import { ArtworkChoice, ArtworkKind, Candidate, CandidateGroup, candidatesOf, linkOf, ratingKeyOf } from './candidates'

const KINDS: { kind: ArtworkKind, emoji: string, label: string, tmdb: string, width: string, height: string, size: string, preview: string }[] = [
  { kind: 'poster', emoji: '🖼️', label: 'Poster', tmdb: 'posters', width: '5.75em', height: '8.625em', size: 'w154', preview: 'w342' },
  { kind: 'backdrop', emoji: '🌄', label: 'Backdrop', tmdb: 'backdrops', width: '12.5em', height: '7.03em', size: 'w300', preview: 'w780' },
  { kind: 'logo', emoji: '🔤', label: 'Logo', tmdb: 'logos', width: '9.375em', height: '3.75em', size: 'w185', preview: 'w500' },
]

type Chosen = Partial<Record<ArtworkKind, { id: string, choice: ArtworkChoice, thumb: string, link?: boolean }>>

// The artworks Plex shows for a movie or a show: those Sensorr stored, or those the metadata stream brought since
export const useArtworksOf = (behavior: 'movie' | 'tv', id: number, metadata) => {
  const { artworks } = useMoviesMetadataContext() as any
  return metadata && 'plex_artworks' in metadata ? metadata.plex_artworks : behavior === 'movie' ? artworks?.[id] || null : null
}

const UIArtworks = ({ behavior, entity, artworks, className = undefined }) => {
  const { Portal, openPortal, closePortal, isOpen: open } = usePortal({ closeOnOutsideClick: false, closeOnEsc: true })
  const ratingKey = ratingKeyOf(artworks)

  if (!ratingKey) {
    return null
  }

  return (
    <>
      <button type='button' className={className} sx={UIArtworks.styles.button} onClick={openPortal} title='Change artworks' aria-label='Change artworks'>
        🖼️
      </button>
      <Portal>
        <Pane position='right' width={['100%', '40em']} background='grayLightest' open={open} toggleOpen={closePortal}>
          {open && <Picker behavior={behavior} entity={entity} artworks={artworks} ratingKey={ratingKey} close={closePortal} />}
        </Pane>
      </Portal>
    </>
  )
}

UIArtworks.styles = {
  button: {
    variant: 'button.reset',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '2em',
    width: '2em',
    borderRadius: '50%',
    backgroundColor: 'gray',
    fontSize: 4,
    cursor: 'pointer',
    transition: 'background-color 200ms ease-in-out',
    ':hover, :focus-visible': {
      backgroundColor: 'grayDark',
    },
  },
}

export const Artworks = memo(UIArtworks)

const Picker = ({ behavior, entity, artworks, ratingKey, close }) => {
  const api = useAPI()
  const tmdb = useTMDB()
  const { i18n: { language } } = useTranslation()
  const region = (language || 'en').split('-')[0]
  const [lists, setLists] = useState({ loading: true, plex: null, tmdb: null, errors: [] as string[] })
  const [chosen, setChosen] = useState<Chosen>({})
  const [links, setLinks] = useState<Partial<Record<ArtworkKind, Candidate[]>>>({})
  const [writing, setWriting] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const plexQuery = api.query.plex.getArtworks({ ratingKey, init: { signal: controller.signal } })

    Promise.allSettled([
      api.fetch(plexQuery.uri, plexQuery.params, plexQuery.init),
      // Without a language TMDB lists every image, where the configured one would leave only its own
      tmdb.fetch(`${behavior}/${entity.id}/images`, { language: '' }, { signal: controller.signal }),
    ]).then(([plex, images]) => {
      if (controller.signal.aborted) {
        return
      }

      setLists({
        loading: false,
        plex: plex.status === 'fulfilled' ? plex.value : null,
        tmdb: images.status === 'fulfilled' ? images.value : null,
        errors: [
          ...(plex.status === 'rejected' ? ['Plex did not answer: its artworks are missing, and nothing can be written'] : []),
          ...(images.status === 'rejected' ? ['TMDB did not answer: its artworks are missing'] : []),
        ],
      })
    })

    return () => controller.abort()
  }, [ratingKey, entity?.id])

  const groups = useMemo(() => KINDS.reduce((acc, { kind, tmdb: list }) => ({
    ...acc,
    [kind]: [
      ...(links[kind]?.length ? [{ label: 'links', items: links[kind] }] : []),
      ...candidatesOf(lists.plex?.[kind] || [], lists.tmdb?.[list] || [], { region, token: api.access_token }),
    ],
  }), {} as Record<ArtworkKind, CandidateGroup[]>), [lists, links, region])

  const choose = useCallback((kind: ArtworkKind, candidate: Candidate) => setChosen((chosen) => ({
    ...chosen,
    [kind]: candidate.current || chosen[kind]?.id === candidate.id ? undefined : { id: candidate.id, choice: candidate.choice, thumb: candidate.thumb, link: candidate.source === 'link' },
  })), [])

  const addLink = useCallback((kind: ArtworkKind, url: string) => {
    const candidate = { id: url, thumb: url, choice: { url }, lang: null, source: 'link', current: false }
    setLinks((links) => ({ ...links, [kind]: [candidate, ...(links[kind] || []).filter(({ id }) => id !== url)] }))
    setChosen((chosen) => ({ ...chosen, [kind]: { id: url, choice: candidate.choice, thumb: url, link: true } }))
  }, [])

  const changed = Object.entries(chosen).filter(([, value]) => value) as [ArtworkKind, { choice: ArtworkChoice }][]

  const apply = async () => {
    setWriting(true)

    try {
      const { uri, params, init } = api.query.plex.postArtworks({ ratingKey, body: Object.fromEntries(changed.map(([kind, { choice }]) => [kind, choice])) })
      const { artworks: written, failed } = await api.fetch(uri, params, init)
      const saving = behavior === 'movie'
        ? api.query.movies.postMovie({ body: { id: entity.id, plex_artworks: written } })
        : api.query.shows.postShows({ body: { [entity.id]: { id: entity.id, plex_artworks: written } } })
      await api.fetch(saving.uri, saving.params, saving.init)

      if (Object.keys(failed || {}).length) {
        toast.error(`Plex refused the ${Object.keys(failed).join(' and ')}: ${Object.values(failed).join(', ')}`)
        setChosen((chosen) => Object.fromEntries(Object.entries(chosen).filter(([kind]) => kind in failed)))
        return
      }

      toast.success('Artworks written on Plex')
      close()
    } catch (err) {
      console.warn(err)
      toast.error('Plex could not write the artworks, nothing changed')
    } finally {
      setWriting(false)
    }
  }

  return (
    <div sx={Picker.styles.element}>
      <div sx={Picker.styles.head}>
        <h2>Artworks</h2>
        <span>{entity?.title || entity?.name}</span>
        <button type='button' onClick={close} aria-label='Close'>
          <Icon value='clear' active={true} height='1.25em' width='1.25em' />
        </button>
      </div>
      <div sx={Picker.styles.body}>
        <Preview artworks={artworks} chosen={chosen} reset={() => setChosen({})} />
        {lists.errors.map((error) => <p key={error} sx={Picker.styles.error}>{error}</p>)}
        <Link onAdd={addLink} />
        {KINDS.map(({ kind, emoji, label, width, height, size }) => (
          <section key={kind} sx={Picker.styles.section}>
            <h3>
              <span aria-hidden={true}>{emoji}</span>
              {label}
              <span>{lists.loading ? '…' : groups[kind].reduce((count, { items, label }) => count + (label === 'links' ? 0 : items.length), 0)}</span>
            </h3>
            {!lists.loading && !groups[kind].length && (
              <p sx={Picker.styles.empty}>No {label.toLowerCase()} on Plex nor on TMDB, paste a link to add one</p>
            )}
            {groups[kind].map(({ label: group, items }) => (
              <div key={group}>
                <small sx={Picker.styles.group}>{group} · {items.length}</small>
                <div sx={Picker.styles.row}>
                  {items.map((candidate) => (
                    <button
                      key={candidate.id}
                      type='button'
                      sx={{ ...Picker.styles.thumb, width, height, ...(kind === 'logo' ? Picker.styles.logo : {}) }}
                      aria-pressed={chosen[kind]?.id === candidate.id}
                      data-current={candidate.current}
                      title={[candidate.source, candidate.lang].filter(Boolean).join(' · ')}
                      onClick={() => choose(kind, candidate)}
                      disabled={writing || !lists.plex}
                    >
                      <Picture path={candidate.thumb} size={size as any} empty={candidate.source === 'link' ? LinkEmpty : undefined} />
                      {candidate.current && <em>current</em>}
                      <code>{candidate.lang || candidate.source}</code>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>
      <div sx={Picker.styles.foot}>
        <Button type='button' variant='outline' color='primary' onClick={close} disabled={writing}>Cancel</Button>
        <Button type='button' color='primary' onClick={apply} disabled={writing || !changed.length || !lists.plex}>
          {writing ? 'Writing…' : 'Apply'}
        </Button>
      </div>
    </div>
  )
}

Picker.styles = {
  element: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: 'grayLightest',
  },
  head: {
    display: 'flex',
    alignItems: 'baseline',
    backgroundColor: 'primary',
    padding: 2,
    paddingBottom: 8,
    '>h2': {
      variant: 'heading.default',
      color: 'whitePure',
      margin: 12,
    },
    '>span': {
      flex: 1,
      marginLeft: 6,
      color: 'whitePure',
      fontSize: 5,
      fontWeight: 'semibold',
      opacity: 0.8,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    '>button': {
      variant: 'button.reset',
      alignSelf: 'center',
      cursor: 'pointer',
      '>svg': {
        color: 'whitePure',
      },
    },
  },
  body: {
    '--artworks-preview': '15em',
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    paddingBottom: 2,
    '>p, >form, >section': {
      marginX: 4,
    },
  },
  error: {
    marginY: 8,
    fontSize: 6,
    color: 'error',
  },
  section: {
    marginTop: 3,
    '>h3': {
      variant: 'heading.default',
      position: 'sticky',
      top: 'var(--artworks-preview)',
      zIndex: 1,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      margin: 12,
      paddingY: 8,
      fontSize: 4,
      backgroundColor: 'grayLightest',
      '>span:last-of-type': {
        fontFamily: 'monospace',
        fontSize: 6,
        fontWeight: 'medium',
        backgroundColor: 'gray',
        borderRadius: '1em',
        paddingX: 8,
        paddingY: 11,
      },
    },
  },
  empty: {
    margin: 12,
    fontSize: 6,
    color: 'grayDarkest',
  },
  group: {
    display: 'block',
    marginTop: 8,
    marginBottom: 9,
    fontFamily: 'monospace',
    fontSize: 7,
    color: 'grayDarkest',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  row: {
    display: 'flex',
    gap: 9,
    overflowX: 'auto',
    paddingBottom: 9,
    scrollbarWidth: 'thin',
  },
  thumb: {
    variant: 'button.reset',
    position: 'relative',
    flex: 'none',
    fontSize: 4,
    cursor: 'pointer',
    '>span': {
      minHeight: '0px',
    },
    // Over the image, which would cover an outline of the button
    '::after': {
      content: '""',
      position: 'absolute',
      inset: '0px',
      boxShadow: 'inset 0 0 0 0 currentColor',
      color: 'primary',
      pointerEvents: 'none',
      transition: 'box-shadow 120ms ease-in-out',
    },
    '&[aria-pressed="true"]::after': {
      boxShadow: 'inset 0 0 0 3px currentColor',
    },
    ':focus-visible': {
      outline: 'none',
    },
    ':focus-visible::after': {
      boxShadow: 'inset 0 0 0 3px currentColor',
      color: 'grayDarkest',
    },
    ':disabled': {
      cursor: 'default',
    },
    '>em': {
      position: 'absolute',
      top: '3px',
      right: '3px',
      paddingX: 9,
      paddingY: 11,
      fontStyle: 'normal',
      fontFamily: 'monospace',
      fontSize: 8,
      fontWeight: 'bold',
      color: 'blackPure',
      backgroundColor: 'primary',
      borderRadius: '1em',
    },
    '>code': {
      position: 'absolute',
      left: '3px',
      bottom: '3px',
      paddingX: 10,
      paddingY: 11,
      fontSize: 8,
      lineHeight: 1,
      color: 'whitePure',
      backgroundColor: 'hsla(0, 0%, 0%, 0.75)',
      borderRadius: '1em',
    },
  },
  logo: {
    '>span': {
      minHeight: '0px',
      background: 'repeating-conic-gradient(var(--theme-ui-colors-grayLight) 0 25%, var(--theme-ui-colors-gray) 0 50%) 0 0 / 1em 1em',
      '>img': {
        objectFit: 'contain',
        padding: '6%',
      },
    },
  },
  foot: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    padding: 4,
    borderTop: '1px solid',
    borderColor: 'gray',
    backgroundColor: 'grayLighter',
  },
}

const LinkEmpty = (props) => <small {...props} sx={{ fontFamily: 'monospace', fontSize: 8, textAlign: 'center', height: 'auto !important', width: '90% !important' }}>Plex fetches it on Apply</small>

// The page of the movie in small: what Apply will leave on Plex
const Preview = ({ artworks, chosen, reset }) => {
  const api = useAPI()
  const current = (kind: ArtworkKind) => artworks?.[kind] ? artworkOf(artworks[kind], null, api.access_token) : null
  const shown = (kind: ArtworkKind) => chosen[kind]?.thumb || current(kind)
  const edited = Object.values(chosen).some(Boolean)

  return (
    <div sx={Preview.styles.element}>
      <div sx={Preview.styles.scene}>
        <div sx={Preview.styles.backdrop} data-changed={!!chosen.backdrop}><Picture path={shown('backdrop')} size='w780' empty={chosen.backdrop?.link ? LinkEmpty : undefined} /></div>
        <div sx={Preview.styles.poster} data-changed={!!chosen.poster}><Picture path={shown('poster')} size='w342' empty={chosen.poster?.link ? LinkEmpty : undefined} /></div>
        {shown('logo')
          ? <div sx={Preview.styles.logo} data-changed={!!chosen.logo}><Picture path={shown('logo')} size='w500' empty={chosen.logo?.link ? LinkEmpty : undefined} /></div>
          : <small sx={Preview.styles.none}>No logo</small>}
      </div>
      <div sx={Preview.styles.legend}>
        {KINDS.map(({ kind, label }) => (
          <span key={kind} data-changed={!!chosen[kind]}>{label.toLowerCase()} {chosen[kind] ? 'changed' : 'current'}</span>
        ))}
        {edited && <button type='button' onClick={reset}>Reset all</button>}
      </div>
    </div>
  )
}

Preview.styles = {
  element: {
    position: 'sticky',
    top: '0px',
    zIndex: 2,
    paddingX: 4,
    paddingTop: 5,
    paddingBottom: 8,
    backgroundColor: 'grayLightest',
    borderBottom: '1px solid',
    borderColor: 'gray',
  },
  scene: {
    position: 'relative',
    height: '12em',
    overflow: 'hidden',
    backgroundColor: 'grayLight',
    '[data-changed="true"]::after': {
      content: '""',
      position: 'absolute',
      inset: '0px',
      boxShadow: 'inset 0 0 0 3px currentColor',
      color: 'primary',
      pointerEvents: 'none',
    },
  },
  backdrop: {
    position: 'absolute',
    inset: '0px',
    'img': {
      filter: 'brightness(0.7)',
    },
  },
  poster: {
    position: 'absolute',
    left: '1em',
    bottom: '1em',
    height: '9.75em',
    width: '6.5em',
    boxShadow: '0 0 0 1px hsla(0, 0%, 100%, 0.1)',
    '>span': {
      minHeight: '0px',
    },
  },
  logo: {
    position: 'absolute',
    left: '8.5em',
    right: '1em',
    bottom: '1.125em',
    height: '4.375em',
    '>span': {
      minHeight: '0px',
      backgroundColor: 'transparent',
    },
    'img': {
      objectFit: 'contain',
      objectPosition: 'left bottom',
    },
  },
  none: {
    position: 'absolute',
    left: '8.5rem',
    bottom: '1.5rem',
    fontFamily: 'monospace',
    fontSize: 7,
    color: 'grayDarkest',
  },
  legend: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    fontFamily: 'monospace',
    fontSize: 7,
    color: 'grayDarkest',
    '>span[data-changed="true"]': {
      color: 'primary',
    },
    '>button': {
      variant: 'button.reset',
      marginLeft: 'auto',
      textDecoration: 'underline',
      cursor: 'pointer',
    },
  },
}

// A link Plex fetches itself: a ThePosterDB page, a MediUX image, any image URL
const Link = ({ onAdd }) => {
  const [value, setValue] = useState('')
  const [kind, setKind] = useState<ArtworkKind>('poster')
  const [error, setError] = useState(null)

  const submit = (e) => {
    e.preventDefault()
    const url = linkOf(value)

    if (!url) {
      setError('Not an image link')
      return
    }

    // Some hosts refuse to be drawn from another site, ThePosterDB among them: Plex, which fetches it, is the check
    onAdd(kind, url)
    setValue('')
    setError(null)
  }

  return (
    <form sx={Link.styles.element} onSubmit={submit}>
      <div>
        <input type='url' value={value} onChange={(e) => { setValue(e.target.value); setError(null) }} placeholder='Paste a link: ThePosterDB, MediUX, any image' aria-label='Image link' aria-invalid={!!error} />
        <select value={kind} onChange={(e) => setKind(e.target.value as ArtworkKind)} aria-label='Artwork kind'>
          {KINDS.map(({ kind, label }) => <option key={kind} value={kind}>{label}</option>)}
        </select>
        <Button type='submit' variant='outline' color='primary' disabled={!value.trim()}>Add</Button>
      </div>
      {!!error && <small role='alert'>{error}</small>}
    </form>
  )
}

Link.styles = {
  element: {
    marginTop: 4,
    '>div': {
      display: 'flex',
      gap: 8,
      '>input, >select': {
        variant: 'input.default',
        width: 'auto',
        fontSize: 5,
      },
      '>input': {
        flex: 1,
        minWidth: '0px',
      },
    },
    '>small': {
      display: 'block',
      marginTop: 9,
      fontSize: 6,
      color: 'error',
    },
  },
}
