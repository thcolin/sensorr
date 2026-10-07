import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import { Trans, useTranslation } from 'react-i18next'
import i18n from '@sensorr/i18n'
import { Button, DragScroll, Pane, Picture, pictureSrc, Warning } from '@sensorr/ui'
import { useAPI } from '../../store/api'
import { useTMDB } from '../../store/tmdb'
import { artworkOf } from '../../store/plex'
import { useMoviesMetadataContext } from '../../contexts/MoviesMetadata/MoviesMetadata'
import { useConfigContext } from '../../contexts/Config/Config'
import { ArtworkChoice, ArtworkKind, Candidate, CandidateGroup, candidatesOf, linkOf, ratingKeyOf, setCandidatesOf } from './candidates'
import { LogoTone, LOGO_FILTERS, toneOfImage } from './tone'

const KINDS: { kind: ArtworkKind, emoji: string, tmdb: string, width: string, height: string, size: string, preview: string }[] = [
  { kind: 'poster', emoji: '🖼️', tmdb: 'posters', width: '5.75em', height: '8.625em', size: 'w154', preview: 'w342' },
  { kind: 'backdrop', emoji: '🌄', tmdb: 'backdrops', width: '12.5em', height: '7.03em', size: 'w300', preview: 'w780' },
  { kind: 'logo', emoji: '🔤', tmdb: 'logos', width: '9.375em', height: '3.75em', size: 'w185', preview: 'w500' },
]

type Chosen = Partial<Record<ArtworkKind, { id: string, choice: ArtworkChoice, thumb: string, link?: boolean }>>

export const useArtworksOf = (behavior: 'movie' | 'tv', id: number, metadata) => {
  const { artworks } = useMoviesMetadataContext() as any
  return metadata && 'plex_artworks' in metadata ? metadata.plex_artworks : behavior === 'movie' ? artworks?.[id] || null : null
}

// A season (`{ number, name, key, seasons }`, its show's `plex_seasons`) only has a poster, written to its own Plex item
const UIArtworks = ({ behavior, entity, artworks, season = null, className = undefined }) => {
  const trigger = useRef<HTMLButtonElement>(null)
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  // Mounted from the start and kept through its way out: the pane slides in and out instead of popping
  const [shown, setShown] = useState(false)
  const ratingKey = season?.key || ratingKeyOf(artworks)

  useEffect(() => {
    if (open) {
      setShown(true)
      return
    }

    const timeout = setTimeout(() => setShown(false), 400)
    return () => clearTimeout(timeout)
  }, [open])

  const close = useCallback(() => {
    setOpen(false)
    setTimeout(() => trigger.current?.focus())
  }, [])

  if (!ratingKey) {
    return null
  }

  return (
    <>
      <button ref={trigger} type='button' className={className} sx={UIArtworks.styles.button} onClick={() => setOpen(true)} title={t('artworks.change')} aria-label={t('artworks.change')} aria-haspopup='dialog'>
        🖼️
      </button>
      {createPortal((
        <Pane position='right' width={['100%', '40em']} open={open} toggleOpen={close}>
          {shown && <Picker behavior={behavior} entity={entity} artworks={artworks} season={season} ratingKey={ratingKey} close={close} />}
        </Pane>
      ), document.body)}
    </>
  )
}

UIArtworks.styles = {
  button: {
    variant: 'button.reset',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: ['2.2em', '2em'],
    width: ['2.2em', '2em'],
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

export const logoSrcOf = (path: string, token: string) => pictureSrc(artworkOf(path, null, token), 'w500')

// Keyed by its path where it is drawn, so that a new logo starts over
const UITitleLogo = ({ path, title, className = undefined }) => {
  const api = useAPI()
  const [tone, setTone] = useState<LogoTone | null>(null)
  const [failed, setFailed] = useState(false)
  const src = logoSrcOf(path, api.access_token)

  if (failed) {
    return <>{title}</>
  }

  return (
    <img
      src={src}
      alt={title}
      className={className}
      sx={UITitleLogo.styles.element}
      style={{ filter: tone ? LOGO_FILTERS[tone] : undefined, opacity: tone ? 1 : 0 }}
      onLoad={(e) => setTone(toneOfImage(e.currentTarget))}
      onError={() => setFailed(true)}
    />
  )
}

UITitleLogo.styles = {
  element: {
    display: 'block',
    maxHeight: '4.5rem',
    maxWidth: ['100%', '32rem'],
    marginX: ['auto', '0em'],
    objectFit: 'contain',
    objectPosition: ['center', 'left bottom'],
    transition: 'opacity 400ms ease-in-out',
  },
}

export const TitleLogo = memo(UITitleLogo)

const rove = (e) => {
  const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key]
  const buttons = Array.from(e.currentTarget.querySelectorAll('button')) as HTMLButtonElement[]
  const next = step && buttons[buttons.indexOf(document.activeElement as HTMLButtonElement) + step]

  if (next) {
    e.preventDefault()
    next.focus()
    next.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }
}

const hostOf = (url: string) => {
  try {
    return new URL(url).host.replace(/^www\./, '')
  } catch {
    return i18n.t('artworks.link.fallback')
  }
}

const Picker = ({ behavior, entity, artworks, season, ratingKey, close }) => {
  const api = useAPI()
  const tmdb = useTMDB()
  const { t, i18n: { language } } = useTranslation()
  const region = (language || 'en').split('-')[0]
  const { config } = useConfigContext()
  // MediUX sets are read for a show's own poster and backdrop, not its seasons'
  const mediux = !season && !!config.get('mediux.token')
  const kinds = useMemo(() => season ? KINDS.filter(({ kind }) => kind === 'poster') : KINDS, [season])
  const title = season ? t('artworks.seasonOf', { season: season.name, show: entity?.name }) : entity?.title || entity?.name
  const [lists, setLists] = useState({ loading: true, plex: null, tmdb: null, sets: null, errors: [] as string[] })
  const [chosen, setChosen] = useState<Chosen>({})
  const [links, setLinks] = useState<Partial<Record<ArtworkKind, Candidate[]>>>({})
  const [writing, setWriting] = useState(false)
  const [preview, setPreview] = useState(0)
  const [adding, setAdding] = useState<ArtworkKind | null>(null)
  const dialog = useRef<HTMLDivElement>(null)

  useEffect(() => {
    dialog.current?.querySelector<HTMLElement>('input:not(:disabled), button')?.focus()
  }, [])

  const trap = (e) => {
    if (e.key === 'Escape' && !writing) {
      e.stopPropagation()
      close()
      return
    }

    if (e.key !== 'Tab') {
      return
    }

    const focusables = Array.from(dialog.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]'))
      .filter((element) => element.tabIndex >= 0)
    const [first, last] = [focusables[0], focusables[focusables.length - 1]]

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last?.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first?.focus()
    }
  }

  const load = useCallback((controller = new AbortController()) => {
    const plexQuery = api.query.plex.getArtworks({ ratingKey, init: { signal: controller.signal } })
    const setsQuery = api.query.mediux.getSets({ type: behavior, id: entity.id, init: { signal: controller.signal } })

    Promise.allSettled([
      api.fetch(plexQuery.uri, plexQuery.params, plexQuery.init),
      // Without a language TMDB lists every image, where the configured one would leave only its own
      tmdb.fetch(season ? `tv/${entity.id}/season/${season.number}/images` : `${behavior}/${entity.id}/images`, { language: '' }, { signal: controller.signal }),
      mediux ? api.fetch(setsQuery.uri, setsQuery.params, setsQuery.init) : Promise.resolve({ sets: null }),
    ]).then(([plex, images, sets]) => {
      if (controller.signal.aborted) {
        return
      }

      setLists({
        loading: false,
        plex: plex.status === 'fulfilled' ? plex.value : null,
        tmdb: images.status === 'fulfilled' ? images.value : null,
        sets: sets.status === 'fulfilled' ? sets.value.sets : null,
        errors: [
          ...(sets.status === 'rejected' ? [t('artworks.errors.mediux')] : []),
          ...(plex.status === 'rejected' ? [t('artworks.errors.plex')] : []),
          ...(images.status === 'rejected' ? [t('artworks.errors.tmdb')] : []),
        ],
      })
    })

    return controller
  }, [ratingKey, entity?.id, behavior, mediux, season?.number])

  useEffect(() => {
    const controller = load()
    return () => controller.abort()
  }, [load])

  const groups = useMemo(() => kinds.reduce((acc, { kind, tmdb: list }) => {
    const [current, ...rest] = candidatesOf(lists.plex?.[kind] || [], lists.tmdb?.[list] || [], { region, token: api.access_token })
    const sets = kind === 'logo' ? [] : setCandidatesOf(lists.sets || [], kind)

    return {
      ...acc,
      [kind]: [
        ...(links[kind]?.length ? [{ label: 'links', items: links[kind] }] : []),
        ...(current?.label === 'current' ? [current] : []),
        ...(sets.length ? [{ label: 'mediux', items: sets }] : []),
        ...(current?.label === 'current' ? rest : [current, ...rest].filter(Boolean)),
      ],
    }
  }, {} as Record<ArtworkKind, CandidateGroup[]>), [kinds, lists, links, region, api.access_token])

  const chooseSet = (set) => {
    const [poster, backdrop] = ['poster', 'backdrop'].map((kind) => setCandidatesOf([set], kind as ArtworkKind)[0])
    const whole = (!poster || chosen.poster?.id === poster.id) && (!backdrop || chosen.backdrop?.id === backdrop.id)
    setChosen((chosen) => ({
      ...chosen,
      ...(poster ? { poster: whole ? undefined : { id: poster.id, choice: poster.choice, thumb: poster.thumb } } : {}),
      ...(backdrop ? { backdrop: whole ? undefined : { id: backdrop.id, choice: backdrop.choice, thumb: backdrop.thumb } } : {}),
    }))
  }

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
    // Its buttons turn disabled while it writes: the focus stays in the pane
    dialog.current?.focus()
    setWriting(true)

    let written, failed

    try {
      const { uri, params, init } = api.query.plex.postArtworks({ ratingKey, body: Object.fromEntries(changed.map(([kind, { choice }]) => [kind, choice])) })
      ;({ artworks: written, failed } = await api.fetch(uri, params, init))
    } catch (err) {
      console.warn(err)
      toast.error(t('artworks.toasts.failed'))
      setWriting(false)
      return
    }

    if (!written) {
      toast.error(t('artworks.toasts.later'))
    } else try {
      const saving = season
        ? api.query.shows.postShows({ body: { [entity.id]: { id: entity.id, plex_seasons: { ...season.seasons, [season.number]: { key: season.key, poster: written.poster } } } } })
        : behavior === 'movie'
          ? api.query.movies.postMovie({ body: { id: entity.id, plex_artworks: written } })
          : api.query.shows.postShows({ body: { [entity.id]: { id: entity.id, plex_artworks: written } } })
      await api.fetch(saving.uri, saving.params, saving.init)
    } catch (err) {
      console.warn(err)
      toast.error(t('artworks.toasts.later'))
    }

    setWriting(false)

    if (Object.keys(failed || {}).length) {
      toast.error(t('artworks.toasts.refused', { kinds: new Intl.ListFormat(language).format(Object.keys(failed).map((kind) => t(`artworks.kinds.${kind}`).toLowerCase())), reasons: Object.values(failed).join(', ') }))
      setChosen((chosen) => Object.fromEntries(Object.entries(chosen).filter(([kind]) => kind in failed)))
      load()
      return
    }

    toast.success(t('artworks.toasts.success'))
    close()
  }

  return (
    <div ref={dialog} tabIndex={-1} sx={Picker.styles.element} role='dialog' aria-modal='true' aria-label={t('artworks.dialog', { title })} onKeyDown={trap}>
      <div sx={Picker.styles.body} style={preview ? { '--artworks-preview': `${preview}px` } as any : undefined}>
        <div sx={Picker.styles.head}>
          <Warning
            emoji='🖼️'
            title={t('artworks.title')}
            subtitle={(
              <span>
                {season
                  ? <Trans t={t} i18nKey='artworks.subtitle.season' values={{ title }} components={[<strong />, <strong />]} />
                  : <Trans t={t} i18nKey='artworks.subtitle.entity' values={{ title }} components={[<strong />, <strong />, <strong />, <strong />]} />}
              </span>
            )}
          />
        </div>
        <Preview
          artworks={artworks}
          current={Object.fromEntries(KINDS.map(({ kind }) => [kind, groups[kind]?.find(({ label }) => label === 'current')?.items[0]?.thumb]))}
          chosen={chosen}
          reset={() => setChosen({})}
          onHeight={setPreview}
        />
        {lists.errors.map((error) => <p key={error} role='alert' sx={Picker.styles.error}>{error}</p>)}
        {mediux && (
          <section sx={Picker.styles.section}>
            <h3>
              <span aria-hidden={true}>🎨</span>
              {t('artworks.sets.title')}
              <span>{lists.loading ? '…' : (lists.sets || []).length}</span>
            </h3>
            {!lists.loading && lists.sets !== null && !lists.sets.length && (
              <p sx={Picker.styles.empty}>{t('artworks.sets.empty')}</p>
            )}
            <DragScroll sx={Picker.styles.row} onKeyDown={rove}>
              {(lists.sets || []).map((set, index) => (
                <button
                  key={set.id}
                  type='button'
                  tabIndex={index ? -1 : 0}
                  aria-label={set.author ? t('artworks.sets.setBy', { title: set.title, author: set.author }) : t('artworks.sets.set', { title: set.title })}
                  sx={Picker.styles.set}
                  aria-pressed={[['poster', set.poster], ['backdrop', set.backdrop]].every(([kind, image]) => !image || chosen[kind]?.id === `mediux:${set.id}:${kind}`)}
                  title={[set.title, set.author].filter(Boolean).join(' · ')}
                  onClick={() => chooseSet(set)}
                  disabled={writing || !lists.plex}
                >
                  <span>
                    {!!set.poster && <span sx={{ width: '5.75em', height: '8.625em' }}><Picture path={set.poster.thumb} /></span>}
                    {!!set.backdrop && <span sx={{ width: '15.33em', height: '8.625em' }}><Picture path={set.backdrop.thumb} /></span>}
                  </span>
                  <code>{set.author || set.title}</code>
                </button>
              ))}
            </DragScroll>
          </section>
        )}
        {kinds.map(({ kind, emoji, width, height, size }) => (
          <section key={kind} sx={Picker.styles.section}>
            <h3>
              <span aria-hidden={true}>{emoji}</span>
              {t(`artworks.kinds.${kind}`)}
              <span>{lists.loading ? '…' : groups[kind].reduce((count, { items, label }) => count + (label === 'links' ? 0 : items.length), 0)}</span>
            </h3>
            {adding === kind && (
              <Link
                label={t(`artworks.kinds.${kind}`)}
                onAdd={(url) => { addLink(kind, url); setAdding(null) }}
                onCancel={() => setAdding(null)}
                disabled={writing}
              />
            )}
            {!lists.loading && !groups[kind].length && (
              <p sx={Picker.styles.empty}>{t('artworks.empty', { kind })}</p>
            )}
            {(groups[kind].length ? groups[kind] : [{ label: null, items: [] }]).map(({ label: group, items }, row) => (
              <div key={group || 'none'}>
                {!!group && <small sx={Picker.styles.group}>{['current', 'others', 'links'].includes(group) ? t(`artworks.groups.${group}`) : group} · {items.length}</small>}
                <DragScroll sx={Picker.styles.row} onKeyDown={rove}>
                  {!row && (
                    <button
                      type='button'
                      tabIndex={0}
                      aria-label={t('artworks.add', { kind })}
                      aria-expanded={adding === kind}
                      title={t('artworks.paste')}
                      sx={{ ...Picker.styles.add, width, height }}
                      onClick={() => setAdding(adding === kind ? null : kind)}
                      disabled={writing || (!lists.loading && !lists.plex)}
                    >
                      <span aria-hidden={true}>+</span>
                    </button>
                  )}
                  {items.map((candidate) => (
                    <button
                      key={candidate.id}
                      type='button'
                      tabIndex={-1}
                      aria-label={t('artworks.candidate', { label: t(`artworks.kinds.${kind}`), lang: candidate.lang || t('artworks.noLanguage'), source: candidate.source === 'link' ? hostOf(candidate.thumb) : candidate.source, current: String(!!candidate.current) })}
                      sx={{ ...Picker.styles.thumb, width, height, ...(kind === 'logo' ? Picker.styles.logo : {}) }}
                      aria-pressed={chosen[kind]?.id === candidate.id}
                      data-current={candidate.current}
                      title={[candidate.source, candidate.lang].filter(Boolean).join(' · ')}
                      onClick={() => choose(kind, candidate)}
                      disabled={writing || !lists.plex}
                    >
                      <Picture path={candidate.thumb} size={size as any} empty={candidate.source === 'link' ? LinkEmpty : undefined} />
                      {candidate.current && <em>{t('artworks.current')}</em>}
                      <code>{candidate.source === 'link' ? hostOf(candidate.thumb) : candidate.lang || candidate.source}</code>
                    </button>
                  ))}
                </DragScroll>
              </div>
            ))}
          </section>
        ))}
      </div>
      <div sx={Picker.styles.foot}>
        <Button type='button' variant='outline' onClick={close} disabled={writing}>{t('ui.controls.cancel')}</Button>
        <Button type='button' onClick={apply} disabled={writing || !changed.length || !lists.plex}>
          {writing ? t('artworks.writing') : t('ui.controls.apply')}
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
    backgroundColor: 'blackPure',
    color: 'whitePure',
    outline: 'none',
  },
  // The Warning the filters panes open on (Library.tsx)
  head: {
    paddingX: 2,
    paddingBottom: 4,
    backgroundColor: 'primary',
    whiteSpace: 'normal',
    '>div': {
      padding: 12,
    },
  },
  body: {
    '--artworks-preview': '14.5em',
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
    paddingX: 8,
    paddingY: 9,
    fontSize: 6,
    color: 'whitePure',
    backgroundColor: 'error',
    borderRadius: '0.25em',
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
      fontWeight: 'semibold',
      color: 'whitePure',
      backgroundColor: 'blackPure',
      '>span:last-of-type': {
        fontFamily: 'monospace',
        fontSize: 6,
        fontWeight: 'medium',
        backgroundColor: 'gray-800',
        borderRadius: '1em',
        paddingX: 8,
        paddingY: 11,
      },
    },
  },
  set: {
    variant: 'button.reset',
    position: 'relative',
    flex: 'none',
    fontSize: 4,
    cursor: 'pointer',
    '>span': {
      display: 'flex',
      gap: 11,
      '>span': {
        display: 'block',
        '>span': {
          minHeight: '0px',
        },
      },
    },
    '::after': {
      content: '""',
      position: 'absolute',
      inset: '0px',
      boxShadow: 'inset 0 0 0 0 currentColor',
      color: 'primary',
      pointerEvents: 'none',
      transition: 'box-shadow 120ms ease-in-out',
    },
    ':hover:not(:disabled)::after': {
      boxShadow: 'inset 0 0 0 1px currentColor',
    },
    '&[aria-pressed="true"]::after': {
      boxShadow: 'inset 0 0 0 3px currentColor',
    },
    ':focus-visible': {
      outline: 'none',
    },
    ':focus-visible::after': {
      boxShadow: 'inset 0 0 0 3px currentColor',
      color: 'whitePure',
    },
    '>code': {
      position: 'absolute',
      left: '3px',
      bottom: '3px',
      paddingX: 10,
      paddingY: 11,
      fontSize: '0.6875em',
      lineHeight: 1,
      color: 'whitePure',
      backgroundColor: 'hsla(0, 0%, 0%, 0.75)',
      borderRadius: '1em',
    },
  },
  empty: {
    margin: 12,
    fontSize: 6,
    color: 'whitePure',
    opacity: 0.8,
  },
  group: {
    display: 'block',
    marginTop: 8,
    marginBottom: 9,
    fontFamily: 'monospace',
    fontSize: '0.6875em',
    color: 'whitePure',
    opacity: 0.8,
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
    ':hover:not(:disabled)::after': {
      boxShadow: 'inset 0 0 0 1px currentColor',
    },
    '&[aria-pressed="true"]::after': {
      boxShadow: 'inset 0 0 0 3px currentColor',
    },
    ':focus-visible': {
      outline: 'none',
    },
    ':focus-visible::after': {
      boxShadow: 'inset 0 0 0 3px currentColor',
      color: 'whitePure',
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
      fontSize: '0.6875em',
      fontWeight: 'bold',
      color: 'primaryDarkest',
      backgroundColor: 'whitePure',
      borderRadius: '1em',
    },
    '>code': {
      position: 'absolute',
      left: '3px',
      bottom: '3px',
      paddingX: 10,
      paddingY: 11,
      fontSize: '0.6875em',
      lineHeight: 1,
      color: 'whitePure',
      backgroundColor: 'hsla(0, 0%, 0%, 0.75)',
      borderRadius: '1em',
    },
  },
  add: {
    variant: 'button.reset',
    flex: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px dashed',
    borderColor: 'gray-600',
    fontSize: 4,
    color: 'gray-400',
    '>span': {
      fontSize: '2em',
      fontWeight: 'light',
      lineHeight: 1,
    },
    transition: 'border-color 120ms ease-in-out, color 120ms ease-in-out',
    ':hover:not(:disabled), &[aria-expanded="true"]': {
      borderColor: 'primary',
      color: 'primary',
    },
    ':focus-visible': {
      outline: 'none',
      borderColor: 'whitePure',
      color: 'whitePure',
    },
    ':disabled': {
      opacity: 0.4,
      cursor: 'default',
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
  // The buttons of the filters panes (Aside.tsx)
  foot: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: 'primaryDarker',
    paddingX: 4,
    paddingY: 0,
    '>*': {
      flex: 1,
      '&:not(:first-of-type)': {
        marginLeft: 6,
      },
      '&:not(:last-of-type)': {
        marginRight: 6,
      },
    },
  },
}

// TMDB answers with CORS headers: its logos can be read to pick their tone
const isTMDB = (path) => typeof path === 'string' && (path.startsWith('https://image.tmdb.org/') || /^\/[\w-]+\.\w+$/.test(path))

const LinkEmpty = (props) => <small {...props} sx={{ fontFamily: 'monospace', fontSize: '0.6875em', color: 'grayDarkest', textAlign: 'center', height: 'auto !important', width: '90% !important' }}>{i18n.t('artworks.fetchOnApply')}</small>

const Preview = ({ artworks, current: listed, chosen, reset, onHeight }) => {
  const { t } = useTranslation()
  const api = useAPI()
  const element = useRef<HTMLDivElement>(null)
  const current = (kind: ArtworkKind) => listed[kind] || (artworks?.[kind] ? artworkOf(artworks[kind], null, api.access_token) : null)

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => onHeight(Math.round(entry.borderBoxSize?.[0]?.blockSize || entry.target.getBoundingClientRect().height)))
    observer.observe(element.current)
    return () => observer.disconnect()
  }, [])
  const shown = (kind: ArtworkKind) => chosen[kind]?.thumb || current(kind)
  const edited = Object.values(chosen).some(Boolean)
  const [tone, setTone] = useState<LogoTone>('as-is')
  const onLogo = useCallback((e, error) => setTone(!error && e?.target ? toneOfImage(e.target) : 'as-is'), [])

  return (
    <div ref={element} sx={Preview.styles.element}>
      <div sx={Preview.styles.scene}>
        <div sx={Preview.styles.backdrop} data-changed={!!chosen.backdrop}><Picture path={shown('backdrop')} size='w780' empty={chosen.backdrop?.link ? LinkEmpty : undefined} /></div>
        <div sx={Preview.styles.poster} data-changed={!!chosen.poster}><Picture path={shown('poster')} size='w342' empty={chosen.poster?.link ? LinkEmpty : undefined} /></div>
        {shown('logo')
          ? <div sx={Preview.styles.logo} data-changed={!!chosen.logo} style={{ filter: LOGO_FILTERS[tone] }}><Picture path={shown('logo')} size='w500' empty={chosen.logo?.link ? LinkEmpty : undefined} onReady={onLogo} crossOrigin={isTMDB(shown('logo')) ? 'anonymous' : undefined} /></div>
          : <div sx={Preview.styles.none}><small>{t('artworks.noLogo')}</small></div>}
      </div>
      {edited && <button type='button' sx={Preview.styles.reset} onClick={reset}>{t('artworks.reset')}</button>}
    </div>
  )
}

Preview.styles = {
  element: {
    position: 'sticky',
    top: '0px',
    zIndex: 2,
    backgroundColor: 'blackPure',
    boxShadow: '0 0.25em 0.5em -0.25em hsla(0, 0%, 0%, 0.35)',
  },
  scene: {
    position: 'relative',
    height: '13em',
    overflow: 'hidden',
    backgroundColor: 'primaryDarkest',
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
  // Centered in the backdrop right of the poster
  logo: {
    position: 'absolute',
    top: '0px',
    bottom: '0px',
    left: '8.5em',
    right: '1em',
    marginY: 'auto',
    height: '4.375em',
    '>span': {
      minHeight: '0px',
      backgroundColor: 'transparent',
    },
    'img': {
      objectFit: 'contain',
      objectPosition: 'center',
    },
  },
  // Where the logo would sit: a logo is expected, and this one has none
  none: {
    position: 'absolute',
    top: '0px',
    bottom: '0px',
    left: '8.5em',
    right: '1em',
    margin: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '4.375em',
    width: 'min(16em, calc(100% - 9.5em))',
    border: '2px dashed',
    borderColor: 'hsla(0, 0%, 100%, 0.7)',
    borderRadius: '0.25em',
    backgroundColor: 'hsla(0, 0%, 0%, 0.25)',
    '>small': {
      fontFamily: 'monospace',
      fontSize: 6,
      color: 'whitePure',
    },
  },
  reset: {
    variant: 'button.reset',
    position: 'absolute',
    top: '0.75em',
    right: '0.75em',
    paddingX: 8,
    paddingY: 10,
    fontFamily: 'monospace',
    fontSize: 7,
    color: 'whitePure',
    backgroundColor: 'hsla(0, 0%, 0%, 0.75)',
    borderRadius: '1em',
    ':hover, :focus-visible': {
      backgroundColor: 'blackPure',
    },
  },
}

const Link = ({ label, onAdd, onCancel, disabled = false }) => {
  const { t } = useTranslation()
  const [value, setValue] = useState('')
  const [error, setError] = useState(null)

  const submit = (e) => {
    e.preventDefault()
    const url = linkOf(value)

    if (!url) {
      setError(t('artworks.link.invalid'))
      return
    }

    // Some hosts refuse to be drawn from another site, ThePosterDB among them: Plex, which fetches it, is the check
    onAdd(url)
  }

  const cancel = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onCancel()
    }
  }

  // Focus leaving the form closes it, unless it goes to the + that toggles it
  const leave = (e) => {
    const next = e.relatedTarget as HTMLElement | null

    if (!e.currentTarget.contains(next) && !next?.matches('[aria-expanded="true"]')) {
      onCancel()
    }
  }

  return (
    <form sx={Link.styles.element} onSubmit={submit} onKeyDown={cancel} onBlur={leave}>
      <div>
        <input type='url' autoFocus={true} disabled={disabled} value={value} onChange={(e) => { setValue(e.target.value); setError(null) }} placeholder={t('artworks.paste')} aria-label={t('artworks.link.label', { label })} aria-invalid={!!error} />
        {/* Safari and Firefox on macOS do not focus a clicked button: the input would lose it to nothing, and close the form before Add */}
        <Button type='submit' variant='outline' disabled={disabled || !value.trim()} onMouseDown={(e) => e.preventDefault()}>{t('artworks.link.add')}</Button>
      </div>
      {!!error && <small role='alert'>{error}</small>}
    </form>
  )
}

Link.styles = {
  element: {
    marginBottom: 8,
    '>div': {
      display: 'flex',
      gap: 8,
      '>input': {
        variant: 'input.default',
        width: 'auto',
        fontSize: 5,
        color: 'whitePure',
        borderColor: 'gray-600',
        ':hover:not(:disabled):not(:focus):not(:active)': {
          borderColor: 'hsla(0, 0%, 100%, 0.8)',
        },
        ':focus,:active:not(:disabled)': {
          borderColor: 'whitePure',
        },
        ':disabled': {
          borderColor: 'hsla(0, 0%, 100%, 0.4)',
          color: 'hsla(0, 0%, 100%, 0.6)',
        },
        '::placeholder': {
          color: 'hsla(0, 0%, 100%, 0.75)',
        },
        flex: 1,
        minWidth: '0px',
      },
    },
    '>small': {
      display: 'inline-block',
      marginTop: 9,
      paddingX: 8,
      paddingY: 10,
      fontSize: 6,
      color: 'whitePure',
      backgroundColor: 'error',
      borderRadius: '0.25em',
    },
  },
}
