import { memo, useEffect, useMemo, useState } from 'react'
import { formatDistanceToNowStrict } from 'date-fns'
import { Button, Icon, Link, Option, Picture, transformMovieDetails } from '@sensorr/ui'
import { emojize, filesize } from '@sensorr/utils'
import { useTMDB } from '../../store/tmdb'
import { useWikiData } from '../../store/wikidata'
import { withMovieMetadataContext } from '../../contexts/MoviesMetadata/MoviesMetadata'
import { Metadata } from '../Details/components/Metadata'
import { Externals, Meaningful } from '../Details/components/Externals'
import { Transition } from '../../components/Sensorr/Proposal'
import { MovieWithCreditsAndReviews } from '../../components/Movie/Movie'
import { Release } from '../../components/Sensorr/Release'
import { Gestures } from '../../components/Sensorr/Gestures'
import { sizeStateOf } from './queue'

export const EMOJI = {
  'refine': '✨',
  'shrink': '✂️',
  'report': '🚩',
  'overdue': '⏳',
}

export const VERDICTS = {
  accept: { emoji: '✅', icon: 'check', label: 'Accepted', color: 'primary', text: 'whitePure' },
  refuse: { emoji: '❌', icon: 'clear', label: 'Refused', color: 'error', text: 'whitePure' },
  ban: { emoji: '⊘', label: 'Banned', color: 'errorDarker', text: 'whitePure' },
  retry: { emoji: '🔁', label: 'Retried', color: 'grayDark', text: 'text' },
  drop: { emoji: '🗑️', label: 'Dropped', color: 'grayDark', text: 'text' },
}

export const delta = (bytes) => !bytes ? '±0' : `${bytes < 0 ? '−' : '+'}${filesize.stringify(Math.abs(bytes))}`

// Kept for the few movies around the active one, so a decision never waits on TMDB.
// `loaded` holds the settled ones, so a card opens with its facts in its first render.
const details = new Map()
const loaded = new Map()

// The size MovieWithCreditsAndReviews asks TMDB for in `display='poster'`.
const POSTER = 'w300'

// One name per element that both forms of the card draw, so the View Transition in
// Proposals.tsx moves it from one place to the other. The class groups them in its CSS,
// and may differ between the two forms while the name stays the same.
export const morph = (kind, id, group = kind) => name(kind, id, group)

// The full card's poster sits in a frame wider than its 2:3 box: the box is what moves,
// named through this property (MORPH in Proposals.tsx).
const poster = (id) => ({ '--morph-poster': `swap-poster-${id}` }) as any

const name = (kind, id, group = kind) => ({ viewTransitionName: `swap-${kind}-${id}`, viewTransitionClass: group }) as any

// A compact row on a wide screen, and its size column: wide enough for the longest size
// pill, so the decisions of every row line up. The open card draws its chevron and its
// size in the same box, so the chevron stays under the pointer that opened it.
const ROW = '88px'
const SIZE = '11.5em'

export const useLoadDetails = () => {
  const tmdb = useTMDB()
  const wikidata = useWikiData()

  return (id) => {
    if (!id) {
      return null
    }

    if (!details.has(id)) {
      details.set(id, Promise.all([
        tmdb.fetch(`movie/${id}`, { append_to_response: 'credits,keywords' }),
        wikidata.fetch(wikidata.query.movies.getMovieAdditionalData.query(id), wikidata.query.movies.getMovieAdditionalData.transform).catch(() => ({})),
      ]).then(async ([movie, additional]) => {
        // The card's poster is decoded before it opens, so it is drawn from its first frame.
        if (movie?.poster_path) {
          const poster = new Image()
          poster.src = `https://image.tmdb.org/t/p/${POSTER}${movie.poster_path}`
          await poster.decode().catch(() => null)
        }

        loaded.set(id, { movie, additional })
        return { movie, additional }
      }).catch((error) => {
        details.delete(id)
        throw error
      }))

      while (details.size > 12) {
        loaded.delete(details.keys().next().value)
        details.delete(details.keys().next().value)
      }
    }

    return details.get(id)
  }
}

const useDetails = (id) => {
  const load = useLoadDetails()
  const [state, setState] = useState({ id: null, movie: null, additional: null })

  useEffect(() => {
    let active = true
    load(id)?.then((loaded) => active && setState({ id, ...loaded })).catch((error) => console.warn(error))
    return () => { active = false }
  }, [id])

  return state.id === id ? state : { id, movie: null, additional: null, ...loaded.get(id) }
}

// Drawn over whichever form the card has when it is decided.
const UIBand = ({ verdict }) => (
  <div sx={{ ...UIBand.styles.element, backgroundColor: VERDICTS[verdict].color, color: VERDICTS[verdict].text }} role='status'>
    <strong sx={UIBand.styles.label}>
      {VERDICTS[verdict].icon ? <><Icon value={VERDICTS[verdict].icon} active={true} width='1em' height='1em' />{VERDICTS[verdict].label}</> : emojize(VERDICTS[verdict].emoji, VERDICTS[verdict].label)}
    </strong>
  </div>
)

UIBand.styles = {
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    svg: {
      color: 'currentColor',
    },
  },
  element: {
    position: 'absolute',
    inset: '0em',
    zIndex: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 3,
    '@keyframes sensorr-proposal-band': {
      from: { transform: 'translateX(-100%)' },
      to: { transform: 'translateX(0%)' },
    },
    animation: 'sensorr-proposal-band 150ms ease-out',
    '@media (prefers-reduced-motion: reduce)': {
      animation: 'none',
    },
  },
}

const Band = memo(UIBand)


// Lightest owned release under the proposed one: lighter holds, heavier breaks.
export const Size = ({ item, threshold, compact = false, named = true }) => item.owned.length ? (
  <>
    <Transition
      style={named ? morph('size', item.id) : undefined}
      axis='size'
      from={emojize('📦', filesize.stringify((item.proposal?.size || 0) - (item.diff.size || 0)))}
      to={filesize.stringify(item.proposal?.size || 0)}
      state={sizeStateOf(item.diff.size, threshold)}
      compact={compact}
    />
  </>
) : <small style={named ? morph('size', item.id) : undefined}>{emojize('📦', filesize.stringify(item.proposal?.size || 0))}</small>

const UIActive = ({ item, entity, metadata, setMetadata, threshold = 0, leaving = null, mobile = false, onGesture, onClose = null, disabled = false, selected = null, selectedVisible = false, onSelectedChange = undefined, ...props }) => {
  const { movie, additional } = useDetails(item.id)
  const [meaningful, setMeaningful] = useState(false)
  // Its selects measure themselves on mount: drawn closed, they would slow every opening.
  const [editing, setEditing] = useState(false)
  const facts = useMemo(() => transformMovieDetails({ ...entity, ...(movie || {}) }), [entity, movie])
  const report = (item.entity?.reports || []).reduce((latest, report) => (!latest || report.date > latest.date) ? report : latest, null)

  return (
    <article sx={{ ...UIActive.styles.element, ...(leaving ? UIActive.styles.leaving : {}) }} aria-current={!leaving}>
      <div sx={UIActive.styles.wrapper}>
        <div sx={UIActive.styles.card}>
          <div sx={UIActive.styles.poster} style={poster(item.id)} data-morph-poster={true}>
            <MovieWithCreditsAndReviews entity={entity} display='poster' meaningful={false} selected={selected} selectedVisible={selectedVisible} onSelectedChange={onSelectedChange} />
          </div>
          <div sx={UIActive.styles.body}>
            <header sx={UIActive.styles.head}>
              <h3 title={facts.title} style={morph('title', item.id)}><Link to={`/movie/${item.id}`}>{facts.title}</Link></h3>
              <span>
                {!!onClose && (
                  <button type='button' onClick={onClose} sx={UIActive.styles.close} style={morph('toggle', item.id)} aria-label='Close' title='Close (Esc)'>
                    <Icon value='chevron' direction={true} width='0.75em' height='0.75em' />
                  </button>
                )}
                <code title={item.owned.length ? `Size against the lightest owned release: ${delta(item.diff.size)}` : 'Size of the proposed release'}>
                  <Size item={item} threshold={threshold} compact={true} />
                </code>
              </span>
            </header>
            <div sx={UIActive.styles.sub}>
              <details sx={UIActive.styles.metadata} onToggle={(e) => setEditing((e.target as HTMLDetailsElement).open)}>
                <summary>
                  <span />
                  <span>
                    {!!entity?.original_title && entity.original_title !== facts.title && <strong>{entity.original_title}</strong>}
                    {!!facts.year && <span style={morph('year', item.id)}>({facts.year})</span>}
                  </span>
                </summary>
                <div>
                  {editing && <Metadata entity={entity || {}} metadata={metadata} setMetadata={setMetadata} />}
                </div>
              </details>
              <aside>
                {emojize(EMOJI[item.command], item.command)}
                <code>#{item.proposal?.job}</code>
              </aside>
            </div>
            {movie ? (
              <div sx={UIActive.styles.facts}>
                {mobile ? (
                  <>
                    <Meaningful meaningful={facts.meaningful} open={meaningful} onToggle={setMeaningful} />
                    <Externals entity={movie} metadata={metadata} additional={additional} meaningful={facts.meaningful} links={false} />
                  </>
                ) : (
                  <Meaningful
                    meaningful={facts.meaningful}
                    open={meaningful}
                    onToggle={setMeaningful}
                    aside={<Externals entity={movie} metadata={metadata} additional={additional} meaningful={facts.meaningful} links={false} />}
                  />
                )}
              </div>
            ) : (
              <div sx={UIActive.styles.skeleton}><span /></div>
            )}
            {/* The movie page's releases band, with the swap drawn under it. */}
            <div sx={UIActive.styles.releases} data-releases={true}>
              <div>
                {item.owned.map(release => (
                  <Release key={release.id} entity={{ ...release, valid: true, from: release.from || 'record' }} compact={true} display={mobile ? 'column' : 'row'} actions={false} />
                ))}
                {item.command === 'report' && !!report && (
                  <p sx={UIActive.styles.report}>
                    <span aria-hidden={true}>🚩</span>
                    <span>
                      <q>{report.message}</q>
                      <small title={new Date(report.date).toLocaleString()}>
                        {[report.username, formatDistanceToNowStrict(new Date(report.date), { addSuffix: true })].filter(Boolean).join(' · ')}
                      </small>
                    </span>
                  </p>
                )}
                {!!item.proposal && (
                  <Release entity={{ ...item.proposal, valid: true }} display={mobile ? 'column' : 'row'} actions={false} />
                )}
              </div>
              {!!item.diff.rows.length && (
                <div sx={UIActive.styles.pills} data-pills={true}>
                  {item.diff.rows.map(({ axis, from, to }) => (
                    <Transition key={axis} axis={axis} from={from} to={to} policy={item.policy} />
                  ))}
                </div>
              )}
              {!mobile && <Gestures onGesture={onGesture} disabled={disabled || !!leaving} sx={UIActive.styles.gestures} />}
            </div>
          </div>
        </div>
      </div>
      {!!leaving && <Band verdict={leaving} />}
    </article>
  )
}

UIActive.styles = {
  element: {
    position: 'relative',
    overflow: 'hidden',
  },
  leaving: {
    pointerEvents: 'none',
  },
  wrapper: {
    borderBottom: '1px solid',
    borderColor: 'gray',
  },
  card: {
    display: 'flex',
    flexDirection: ['column', 'row'],
    alignItems: 'stretch',
    gap: 4,
    paddingX: 4,
    paddingTop: 4,
    paddingBottom: [4, '0em'],
  },
  // Movie's poster sizes itself, badges included, as on every other page.
  poster: {
    position: 'relative',
    zIndex: 1,
    flexShrink: 0,
    alignSelf: ['center', 'flex-start'],
  },
  body: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    '>*': {
      order: [3, 'initial'],
    },
    '>header': {
      order: [0, 'initial'],
    },
    '>div[data-releases]': {
      order: [1, 'initial'],
    },

  },
  // On a wide screen the chevron and the size take the compact row's place, whatever the
  // height of the title.
  head: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 4,
    paddingRight: ['0em', `calc(${SIZE} + 3em)`],
    '>h3': {
      margin: 12,
      marginRight: 'auto',
      minWidth: 0,
    },
    '>span': {
      position: ['static', 'absolute'],
      top: '0em',
      right: 4,
      zIndex: 1,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      flexShrink: 0,
      height: ['auto', ROW],
    },
    '>span >code': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      minWidth: ['auto', SIZE],
      fontFamily: 'monospace',
      whiteSpace: 'nowrap',
      '>small': {
        fontSize: 7,
      },
    },
  },
  sub: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 4,
    '>details': {
      flex: 1,
      minWidth: 0,
    },
    '>aside': {
      display: 'inline-flex',
      alignItems: 'baseline',
      gap: 8,
      flexShrink: 0,
      color: 'grayDarker',
      fontSize: 6,
      whiteSpace: 'nowrap',
      '>code': {
        fontFamily: 'monospace',
      },
    },
  },
  metadata: {
    fontSize: 5,
    '>summary': {
      position: 'relative',
      lineHeight: 'space',
      cursor: 'pointer',
      '>span:first-of-type': {
        position: 'absolute',
        width: '1em',
        height: '100%',
        left: '0em',
      },
      '>span:last-of-type': {
        display: 'inline-flex',
        gap: 8,
        marginLeft: 8,
        '>strong': {
          fontWeight: 'strong',
        },
      },
    },
    '>div': {
      borderBottom: '1px solid',
      borderColor: 'grayLight',
    },
  },
  // Both sit right above the releases band on a wide screen: they keep it at a distance.
  skeleton: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: [0, 4],
    '>span': {
      display: 'block',
      height: '2em',
      width: '32em',
      maxWidth: '100%',
      backgroundColor: 'grayLight',
      borderRadius: '0.25em',
    },
  },
  // The movie page's releases band. It stays in the body column, and its shadow paints
  // the same grey out to both edges of the card, behind the poster.
  releases: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    marginTop: 'auto',
    paddingTop: '1.5em',
    paddingBottom: '2.5em',
    backgroundColor: 'grayLighter',
    boxShadow: (theme) => `0 0 0 100vmax ${theme.colors.grayLighter}`,
    clipPath: 'inset(0 -100vmax)',
    '>div:first-of-type': {
      display: 'flex',
      flexDirection: 'column',
    },
  },
  // Laid on the release rows' columns: the flag in the icon's, the text under the name.
  report: {
    display: 'flex',
    alignItems: 'baseline',
    margin: 12,
    paddingX: [12, 2],
    paddingY: 8,
    fontSize: 6,
    '>span:first-of-type': {
      flexShrink: 0,
      width: '4.5em',
      textAlign: 'center',
    },
    '>span:last-of-type': {
      display: 'flex',
      alignItems: 'baseline',
      flexWrap: 'wrap',
      columnGap: 8,
      minWidth: 0,
      overflowWrap: 'anywhere',
    },
    '>span >small': {
      color: 'grayDarker',
      whiteSpace: 'nowrap',
    },
  },
  // The row's open chevron, turned over: same place, same grey, always shown.
  close: {
    variant: 'button.reset',
    alignSelf: 'center',
    display: 'flex',
    padding: 10,
    marginRight: 8,
    color: 'grayDarkest',
    cursor: 'pointer',
    'svg path': {
      opacity: 0.4,
      transition: 'opacity 150ms ease-in-out',
    },
    ':hover, :focus-visible': {
      'svg path': { opacity: 1 },
    },
    ':focus-visible': {
      outline: '1px solid',
      outlineColor: 'grayDarkest',
      borderRadius: '0.25em',
    },
  },
  facts: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: 3,
    rowGap: 8,
    marginBottom: [0, 4],
  },
  gestures: {
    marginTop: 6,
  },
  pills: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    columnGap: 7,
    rowGap: 8,
    paddingY: 8,
  },
}

export const Active = memo(withMovieMetadataContext({ enhanced: true })(UIActive))

const Select = ({ id, checked, visible, label, onChange, disabled = false, layout = {} }) => (
  <div sx={{ ...Select.styles.element, ...layout }} data-select={true} data-visible={checked || visible} data-checked={checked}>
    <Option id={id} type='checkbox' behavior='radio' borderless={true} checked={checked} disabled={disabled} onChange={onChange} aria-label={label} />
  </div>
)

Select.styles = {
  element: {
    position: 'relative',
    zIndex: 1,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2em',
    height: '2em',
    borderRadius: '2em',
    border: '0.25em solid',
    borderColor: 'grayLightest',
    backgroundColor: 'gray',
    opacity: 0,
    visibility: 'hidden',
    transition: 'opacity 150ms ease-in-out, visibility 0ms 150ms, background-color 150ms ease-in-out',
    '&[data-visible=true]': {
      opacity: 1,
      visibility: 'visible',
      transition: 'opacity 150ms ease-in-out, background-color 150ms ease-in-out',
    },
    '&[data-checked=true]': {
      backgroundColor: 'primary',
    },
    '>label': {
      marginY: 12,
    },
  },
}

// On a wide screen the chevron next to the decisions opens the card. A phone has no
// hover to show them: there, a button stretched under the whole row opens it.
const UICompact = ({ item, onSelect, onHover = null, onDecide = null, disabled = false, threshold = 0, leaving = null, morphing = false, selected = false, selectedVisible = false, onSelectedChange = null, ...props }) => {
  const year = item.entity?.release_date && new Date(item.entity.release_date).getFullYear()
  const morph = morphing ? name : () => undefined
  const label = `Open ${item.entity?.title || 'proposal'}`

  return (
    <div sx={{ ...UICompact.styles.element, ...(leaving ? { pointerEvents: 'none' } : {}) }} onPointerEnter={onHover ? () => onHover(item.id) : undefined}>
      <button type='button' onClick={() => onSelect(item.id)} sx={UICompact.styles.open} aria-label={label} tabIndex={-1} />
      <span sx={UICompact.styles.poster} style={morphing ? poster(item.id) : undefined} data-morph-poster={true}>
        <Picture path={item.entity?.poster_path} size='w92' />
      </span>
      {!!onSelectedChange && (
        <Select
          id={`select-${item.id}`}
          checked={selected}
          visible={selectedVisible}
          disabled={!!leaving}
          label={`Select ${item.entity?.title || 'proposal'}`}
          onChange={() => onSelectedChange(item.id)}
          layout={UICompact.styles.select}
        />
      )}
      <span sx={UICompact.styles.body}>
        <span sx={UICompact.styles.title}>
          <strong title={item.entity?.title} style={morph('title', item.id)}>{item.entity?.title}</strong>
          {!!year && <small style={morph('year', item.id)}>{year}</small>}
        </span>
        <span sx={UICompact.styles.diff}>
          <span>
            {item.diff.listed.map(({ axis, from, to }) => (
              <Transition key={axis} axis={axis} from={from} to={to} policy={item.policy} compact={true} />
            ))}
          </span>
        </span>
      </span>
      {!!onDecide && (
        <div sx={UICompact.styles.decide} data-decide={true}>
          {(['accept', 'refuse'] as const).map(verdict => (
            <button
              key={verdict}
              type='button'
              disabled={disabled}
              onClick={() => onDecide(verdict)}
              aria-label={verdict === 'accept' ? 'Accept' : 'Refuse'}
              data-verdict={verdict}
            >
              <Icon value={verdict === 'accept' ? 'check' : 'clear'} width='1.125em' height='1.125em' />
            </button>
          ))}
          <span aria-hidden={true} />
          <button type='button' onClick={() => onSelect(item.id)} aria-label={label} title='Open' data-toggle={true} style={morph('toggle', item.id)}>
            <Icon value='chevron' direction={false} width='0.75em' height='0.75em' />
          </button>
        </div>
      )}
      <code sx={UICompact.styles.size} title={item.owned.length ? `Size against the lightest owned release: ${delta(item.diff.size)}` : 'Size of the proposed release'}>
        <Size item={item} threshold={threshold} compact={true} named={morphing} />
      </code>
      {!!leaving && <Band verdict={leaving} />}
    </div>
  )
}

UICompact.styles = {
  // The size sits in its own column, centred on the row; on a phone it drops under the pills.
  element: {
    position: 'relative',
    display: 'grid',
    gridTemplateColumns: ['auto 1fr', `auto 1fr auto minmax(${SIZE}, auto)`],
    gridTemplateRows: ['1fr auto', '1fr'],
    gridTemplateAreas: ['"poster body" "poster size"', '"poster body decide size"'],
    alignItems: 'center',
    columnGap: 6,
    rowGap: 8,
    width: '100%',
    height: ['108px', ROW],
    paddingX: 4,
    paddingY: 8,
    borderBottom: '1px solid',
    borderColor: 'gray',
    transition: 'background-color 200ms ease-in-out',
    ':hover': {
      backgroundColor: 'grayLightest',
    },
    '>span, >code': {
      pointerEvents: 'none',
    },
    '@media (hover: hover)': {
      ':hover, :focus-within': {
        '>[data-decide] >*': { opacity: 1, transition: 'opacity 150ms ease-in-out' },
        '>[data-select]': { opacity: 1, visibility: 'visible', transition: 'opacity 150ms ease-in-out, background-color 150ms ease-in-out' },
      },
    },
  },
  select: {
    gridArea: 'poster',
    alignSelf: 'start',
    justifySelf: 'start',
    marginTop: '-0.375em',
    marginLeft: '-0.625em',
  },
  open: {
    variant: 'button.reset',
    display: ['block', 'none'],
    position: 'absolute',
    inset: '0px',
    cursor: 'pointer',
    ':focus-visible': {
      outline: '1px solid',
      outlineColor: 'grayDarkest',
      outlineOffset: '-1px',
    },
  },
  // Hovering the row fades the icons in, leaving it fades them out.
  decide: {
    position: 'relative',
    zIndex: 1,
    gridArea: 'decide',
    alignSelf: 'stretch',
    display: ['none', 'flex'],
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    width: '12em',
    marginY: -8,
    pointerEvents: 'auto',
    '>span': {
      width: '1px',
      height: '1.125em',
      marginX: 6,
      backgroundColor: 'grayDark',
      opacity: 0,
      transition: 'opacity 150ms ease-in-out',
    },
    // The chevron opens rather than decides: set apart from the two verdicts.
    '>button[data-toggle]': {
      marginLeft: 8,
      marginRight: 8,
    },
    '>button': {
      variant: 'button.reset',
      display: 'flex',
      padding: 10,
      color: 'grayDarkest',
      cursor: 'pointer',
      opacity: 0,
      transition: 'opacity 150ms ease-in-out',
      // Both faint at rest and solid grey under the pointer. The clear icon brings its
      // own colour, so both svgs get the same one here.
      svg: {
        color: 'grayDarkest',
      },
      'svg path': {
        opacity: 0.2,
        transition: 'opacity 150ms ease-in-out',
      },
      ':hover:not(:disabled), :focus-visible': {
        'svg path': { opacity: 1 },
      },
      ':focus-visible': {
        opacity: 1,
        outline: '1px solid',
        outlineColor: 'grayDarkest',
        borderRadius: '0.25em',
      },
      ':disabled': {
        cursor: 'default',
      },
    },
  },
  poster: {
    gridArea: 'poster',
    alignSelf: 'stretch',
    display: 'flex',
    height: '100%',
    aspectRatio: '2 / 3',
    marginRight: 8,
    borderRadius: '0.25em',
    overflow: 'hidden',
    '>span': { width: '100%' },
  },
  body: {
    gridArea: 'body',
    alignSelf: ['end', 'center'],
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 6,
  },
  title: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
    '>strong': {
      fontFamily: 'heading',
      fontWeight: 'heading',
      fontSize: '1.125em',
      lineHeight: 'heading',
      minWidth: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    '>small': {
      flexShrink: 0,
      color: 'grayDarker',
      fontFamily: 'monospace',
      fontSize: 6,
    },
  },
  // On a phone the size takes a line of its own, so the axes keep the whole width.
  diff: {
    display: 'flex',
    flexDirection: ['column', 'row'],
    alignItems: ['flex-start', 'center'],
    justifyContent: 'space-between',
    gap: 8,
    // A pill that does not fit wraps onto a hidden second line rather than being cut.
    '>span': {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'flex-start',
      gap: 7,
      minWidth: 0,
      maxWidth: '100%',
      height: '1.3em',
      overflow: 'hidden',
    },
  },
  size: {
    gridArea: 'size',
    justifySelf: ['start', 'end'],
    display: 'flex',
    alignItems: 'center',
    fontFamily: 'monospace',
    color: 'text',
    '>small': {
      fontSize: 7,
    },
  },
}

export const Compact = memo(UICompact)

// An accepted swap that never landed: what Plex has against what was accepted, and the
// three ways out. It never opens into a card.
const UIOverdue = ({ item, onGesture, onSearch, disabled = false, threshold = 0, leaving = null }) => {
  const year = item.entity?.release_date && new Date(item.entity.release_date).getFullYear()
  const accepted = item.proposal?.accepted_at
  const title = item.entity?.title

  return (
    <div sx={{ ...UICompact.styles.element, ...UIOverdue.styles.element, ...(leaving ? { pointerEvents: 'none' } : {}) }}>
      <span sx={{ ...UICompact.styles.poster, ...UIOverdue.styles.poster }}>
        <Picture path={item.entity?.poster_path} size='w92' />
      </span>
      <span sx={UICompact.styles.body}>
        <span sx={UICompact.styles.title}>
          <strong title={title}>{title}</strong>
          {!!year && <small>{year}</small>}
        </span>
        <span sx={UICompact.styles.diff}>
          <span>
            {item.diff.listed.map(({ axis, from, to }) => (
              <Transition key={axis} axis={axis} from={from} to={to} policy={item.policy} compact={true} />
            ))}
          </span>
          <small sx={UIOverdue.styles.age} title={accepted ? new Date(accepted).toLocaleString() : undefined}>
            {[item.proposal?.znab, accepted && `accepted ${formatDistanceToNowStrict(new Date(accepted), { addSuffix: true })}`, 'not on Plex'].filter(Boolean).join(' · ')}
          </small>
        </span>
      </span>
      <span sx={UIOverdue.styles.actions}>
        <Button variant='outline' color='gray' disabled={disabled || !!leaving} onClick={() => onGesture('retry')} title='Send the same .torrent to the blackhole again' aria-label={`Retry ${title}`}>Retry</Button>
        <Button variant='outline' color='gray' disabled={disabled || !!leaving} onClick={onSearch} title='Pick another release in its place' aria-label={`Search another release of ${title}`}>Search</Button>
        <Button variant='outline' color='gray' disabled={disabled || !!leaving} onClick={() => onGesture('drop')} title='Remove the accepted release and keep what Plex has' aria-label={`Drop the swap of ${title}, Plex keeps its version`} data-drop={true}>Drop</Button>
      </span>
      <code sx={UICompact.styles.size} title={`Size against the lightest owned release: ${delta(item.diff.size)}`}>
        <Size item={item} threshold={threshold} compact={true} named={false} />
      </code>
      {!!leaving && <Band verdict={leaving} />}
    </div>
  )
}

UIOverdue.styles = {
  // On a phone the gestures take a line of their own under the poster, so it keeps its height.
  element: {
    gridTemplateColumns: ['auto 1fr', `auto 1fr auto minmax(${SIZE}, auto)`],
    gridTemplateRows: ['1fr auto auto', '1fr'],
    gridTemplateAreas: ['"poster body" "poster size" "actions actions"', '"poster body actions size"'],
    height: ['auto', ROW],
    ':hover': {
      backgroundColor: 'transparent',
    },
    '>span, >code': {
      pointerEvents: 'auto',
    },
  },
  // Same box as the compact row's poster on a phone, whatever the height of the gestures.
  poster: {
    alignSelf: ['start', 'stretch'],
    height: ['92px', '100%'],
  },
  age: {
    flexShrink: 0,
    color: 'grayDarkest',
    fontSize: 6,
  },
  actions: {
    gridArea: 'actions',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    // Drop is set apart from the two ways of getting the swap, like the chevron of the compact row.
    '>button': {
      flex: [1, 'none'],
      justifyContent: 'center',
      minHeight: ['44px', 'auto'],
    },
    '>button[data-drop]': {
      marginLeft: [12, 8],
    },
  },
}

export const Overdue = memo(UIOverdue)

// A row while the queue loads: the compact row's own grid, with a bar where each text goes.
// `shape` sets the title's width and the pills', in em, so the rows do not repeat.
export const Placeholder = ({ shape }: { shape: number[] }) => {
  const [title, ...pills] = shape

  return (
    <div sx={{ ...UICompact.styles.element, ':hover': {} }} aria-hidden={true}>
      <span sx={{ ...UICompact.styles.poster, ...Placeholder.styles.bar, ...Placeholder.styles.poster }} />
      <span sx={UICompact.styles.body}>
        <span sx={UICompact.styles.title}>
          <span sx={{ ...Placeholder.styles.bar, width: `${title}em`, height: '1em' }} />
          <span sx={{ ...Placeholder.styles.bar, width: '2.25em', height: '0.75em' }} />
        </span>
        <span sx={UICompact.styles.diff}>
          <span>
            {pills.map((width, i) => <span key={i} sx={{ ...Placeholder.styles.bar, ...Placeholder.styles.pill, width: `${width}em` }} />)}
          </span>
        </span>
      </span>
      <span sx={{ ...UICompact.styles.size, ...Placeholder.styles.bar, ...Placeholder.styles.pill, width: '10em' }} />
    </div>
  )
}

// Still, like an empty poster anywhere else in the app. The poster box takes the grey
// Picture draws before its image, so nothing changes colour when the rows arrive.
Placeholder.styles = {
  bar: {
    display: 'block',
    borderRadius: '0.25em',
    backgroundColor: 'gray',
  },
  poster: {
    backgroundColor: 'grayLight',
  },
  pill: {
    height: '1.25rem',
    borderRadius: '1em',
  },
}

export const UIGroupTitle = ({ group, emoji, label, count, open, onToggle, selected = false, onSelectedChange = null, ...props }) => (
  <h6 {...props} sx={UIGroupTitle.styles.element}>
    <button type='button' onClick={onToggle} aria-expanded={open} sx={UIGroupTitle.styles.toggle}>
      <Icon value='chevron' direction={false} width='0.625em' height='0.625em' style={{ transform: open ? 'none' : 'rotate(-90deg)' }} />
      <span>{emojize(emoji, label)}</span>
      <code>{count}</code>
    </button>
    {!!onSelectedChange && (
      <span sx={UIGroupTitle.styles.end}>
        <span data-select-all={true}>
          <Option id={`select-${group}`} type='checkbox' checked={selected} onChange={onSelectedChange}>
            {selected ? 'Unselect All' : 'Select All'}
          </Option>
        </span>
      </span>
    )}
  </h6>
)

UIGroupTitle.styles = {
  element: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingX: 4,
    paddingY: 6,
    margin: 12,
    backgroundColor: 'grayLighter',
    borderBottom: '1px solid',
    borderColor: 'grayLight',
  },
  end: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    '>[data-select-all]': {
      display: 'inline-flex',
      opacity: 0.6,
      fontFamily: 'body',
      fontWeight: 'body',
      fontSize: 6,
      transition: 'opacity 200ms ease-in-out',
      ':hover, :focus-within': {
        opacity: 1,
      },
      // No taller than the title, so the group keeps the height the list reserves for it.
      label: {
        marginY: 12,
        lineHeight: 1,
      },
    },
  },
  toggle: {
    variant: 'button.reset',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
    '::after': {
      content: '""',
      position: 'absolute',
      inset: '-0.75em 0em',
    },
    ':focus-visible': {
      outline: '1px solid',
      outlineColor: 'grayDarkest',
      outlineOffset: '2px',
    },
    fontWeight: 'inherit',
    cursor: 'pointer',
    '>code': {
      fontFamily: 'monospace',
      color: 'grayDarker',
    },
  },
}

export const GroupTitle = memo(UIGroupTitle)

export const GroupPlaceholder = () => (
  <h6 sx={UIGroupTitle.styles.element} aria-hidden={true}>
    <span sx={{ ...Placeholder.styles.bar, width: '7.5em', height: '1em' }} />
  </h6>
)
