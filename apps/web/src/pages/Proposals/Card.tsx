import { memo, useEffect, useMemo, useState } from 'react'
import { Icon, Link, Picture, transformMovieDetails } from '@sensorr/ui'
import { emojize, filesize } from '@sensorr/utils'
import Tippy from '@tippyjs/react'
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
}

export const VERDICTS = {
  accept: { emoji: '✅', label: 'Accepted', color: 'primary', text: 'whitePure' },
  refuse: { emoji: '❌', label: 'Refused', color: 'grayDark', text: 'text' },
  ban: { emoji: '⊘', label: 'Banned', color: 'errorDarker', text: 'whitePure' },
}

export const delta = (bytes) => !bytes ? '±0' : `${bytes < 0 ? '−' : '+'}${filesize.stringify(Math.abs(bytes))}`

// Kept for the few movies around the active one, so a decision never waits on TMDB.
const details = new Map()

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
      ]).then(([movie, additional]) => ({ movie, additional })).catch((error) => {
        details.delete(id)
        throw error
      }))

      while (details.size > 12) {
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

  return state.id === id ? state : { id, movie: null, additional: null }
}



// Lightest owned release under the proposed one: lighter holds, heavier breaks.
const Size = ({ item, threshold, compact = false }) => item.owned.length ? (
  <>
    <Transition
      axis='size'
      from={emojize('📦', filesize.stringify((item.proposal?.size || 0) - (item.diff.size || 0)))}
      to={filesize.stringify(item.proposal?.size || 0)}
      state={sizeStateOf(item.diff.size, threshold)}
      compact={compact}
    />
  </>
) : <>{emojize('📦', filesize.stringify(item.proposal?.size || 0))}</>

const UIActive = ({ item, entity, metadata, setMetadata, threshold = 0, leaving = null, entering = true, mobile = false, onGesture, onClose = null, disabled = false, ...props }) => {
  const { movie, additional } = useDetails(item.id)
  const [meaningful, setMeaningful] = useState(false)
  const facts = useMemo(() => transformMovieDetails({ ...entity, ...(movie || {}) }), [entity, movie])
  const verdict = leaving && VERDICTS[leaving]

  return (
    <article sx={{ ...UIActive.styles.element, ...(leaving ? UIActive.styles.leaving : entering ? UIActive.styles.entering : {}) }} aria-current={!leaving}>
      <div sx={UIActive.styles.collapse}>
        <div sx={UIActive.styles.wrapper}>
          <div sx={UIActive.styles.card}>
            <div sx={UIActive.styles.poster}>
              <MovieWithCreditsAndReviews entity={entity} display='poster' meaningful={false} />
            </div>
            <div sx={UIActive.styles.body}>
              <header sx={UIActive.styles.head}>
                <h3 title={facts.title}><Link to={`/movie/${item.id}`}>{facts.title}</Link></h3>
                <code title={item.owned.length ? `Size against the lightest owned release: ${delta(item.diff.size)}` : 'Size of the proposed release'}>
                  <Size item={item} threshold={threshold} />
                </code>
                {!!onClose && (
                  <button type='button' onClick={onClose} sx={UIActive.styles.close} aria-label='Close' title='Close (Esc)'>
                    <Icon value='chevron' direction={false} width='0.625em' height='0.625em' style={{ transform: 'rotate(180deg)' }} />
                  </button>
                )}
              </header>
              <div sx={UIActive.styles.sub}>
                <details sx={UIActive.styles.metadata}>
                  <summary>
                    <span />
                    <span>
                      {!!entity?.original_title && entity.original_title !== facts.title && <strong>{entity.original_title}</strong>}
                      {!!facts.year && <span>({facts.year})</span>}
                    </span>
                  </summary>
                  <div>
                    <Metadata entity={entity || {}} metadata={metadata} setMetadata={setMetadata} help={false} />
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
                {!mobile && <Gestures onGesture={onGesture} disabled={disabled || !!leaving} />}
              </div>
            </div>
          </div>
        </div>
      </div>
      {!!verdict && (
        <div sx={{ ...UIActive.styles.band, backgroundColor: verdict.color, color: verdict.text }} role='status'>
          <strong>{emojize(verdict.emoji, verdict.label)}</strong>
        </div>
      )}
    </article>
  )
}

UIActive.styles = {
  element: {
    position: 'relative',
    overflow: 'hidden',
    '@keyframes sensorr-proposal-expand': {
      from: { gridTemplateRows: '0fr', opacity: 0 },
      to: { gridTemplateRows: '1fr', opacity: 1 },
    },
    '@keyframes sensorr-proposal-collapse': {
      from: { gridTemplateRows: '1fr' },
      to: { gridTemplateRows: '0fr' },
    },
    '@keyframes sensorr-proposal-band': {
      from: { transform: 'translateX(-100%)' },
      to: { transform: 'translateX(0%)' },
    },
    '@keyframes sensorr-proposal-fade': {
      from: { opacity: 1 },
      to: { opacity: 0 },
    },
  },
  entering: {
    '>div:first-of-type': {
      animation: 'sensorr-proposal-expand 250ms ease-in-out',
      '@media (prefers-reduced-motion: reduce)': {
        animation: 'none',
      },
    },
  },
  leaving: {
    pointerEvents: 'none',
    '>div:first-of-type': {
      animation: 'sensorr-proposal-collapse 250ms ease-in-out 150ms forwards',
    },
    '@media (prefers-reduced-motion: reduce)': {
      animation: 'sensorr-proposal-fade 250ms ease-in-out forwards',
      '>div:first-of-type': {
        animation: 'none',
      },
    },
  },
  collapse: {
    display: 'grid',
    gridTemplateRows: '1fr',
    '>div': {
      minHeight: 0,
      overflow: 'hidden',
    },
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
  head: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 4,
    '>h3': {
      margin: 12,
      marginRight: 'auto',
      minWidth: 0,
    },
    '>code': {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      flexShrink: 0,
      fontFamily: 'monospace',
      fontSize: 4,
      fontWeight: 'bold',
      whiteSpace: 'nowrap',
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
  close: {
    variant: 'button.reset',
    alignSelf: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2em',
    height: '2em',
    borderRadius: '50%',
    color: 'grayDarkest',
    cursor: 'pointer',
    ':hover': {
      color: 'text',
      backgroundColor: 'grayLight',
    },
    ':focus-visible': {
      outline: '1px solid',
      outlineColor: 'grayDarkest',
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
  pills: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    columnGap: 7,
    rowGap: 8,
    paddingY: 8,
  },
  band: {
    position: 'absolute',
    inset: '0em',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 3,
    animation: 'sensorr-proposal-band 150ms ease-in-out',
    '@media (prefers-reduced-motion: reduce)': {
      animation: 'none',
    },
  },
}

export const Active = memo(withMovieMetadataContext({ enhanced: true })(UIActive))

// The row is not a button itself: the hover decisions would be buttons nested in it.
// A button stretched under the content opens the card; the decisions sit above it.
const UICompact = ({ item, onSelect, onDecide = null, disabled = false, threshold = 0, ...props }) => {
  const year = item.entity?.release_date && new Date(item.entity.release_date).getFullYear()

  return (
    <div sx={UICompact.styles.element}>
      <button type='button' onClick={() => onSelect(item.id)} sx={UICompact.styles.open} aria-label={`Open ${item.entity?.title || 'proposal'}`} />
      <span sx={UICompact.styles.poster}>
        <Picture path={item.entity?.poster_path} size='w92' />
      </span>
      <span sx={UICompact.styles.body}>
        <span sx={UICompact.styles.title}>
          <strong title={item.entity?.title}>{item.entity?.title}</strong>
          {!!year && <small>{year}</small>}
        </span>
        <span sx={UICompact.styles.diff}>
          <span>
            {item.diff.changed.map(({ axis, from, to }) => (
              <Transition key={axis} axis={axis} from={from} to={to} policy={item.policy} compact={true} />
            ))}
          </span>
        </span>
      </span>
      {!!onDecide && (
        <div sx={UICompact.styles.decide} data-decide={true} onClick={(e) => e.target === e.currentTarget && onSelect(item.id)}>
          {(['accept', 'refuse'] as const).map(verdict => (
            <Tippy key={verdict} content={<code>{verdict === 'accept' ? 'Accept' : 'Refuse'}</code>} delay={[300, 0]}>
              <button
                type='button'
                disabled={disabled}
                onClick={() => onDecide(verdict)}
                aria-label={verdict === 'accept' ? 'Accept' : 'Refuse'}
                data-verdict={verdict}
              >
                <Icon value={verdict === 'accept' ? 'check' : 'clear'} width='1.125em' height='1.125em' />
              </button>
            </Tippy>
          ))}
        </div>
      )}
      <code sx={UICompact.styles.size} title={item.owned.length ? `Size against the lightest owned release: ${delta(item.diff.size)}` : 'Size of the proposed release'}>
        {item.owned.length ? <Size item={item} threshold={threshold} compact={true} /> : <small>{emojize('📦', filesize.stringify(item.proposal?.size || 0))}</small>}
      </code>
    </div>
  )
}

UICompact.styles = {
  // The size sits in its own column, centred on the row; on a phone it drops under the pills.
  element: {
    position: 'relative',
    display: 'grid',
    gridTemplateColumns: ['auto 1fr', 'auto 1fr auto auto'],
    gridTemplateRows: ['1fr auto', '1fr'],
    gridTemplateAreas: ['"poster body" "poster size"', '"poster body decide size"'],
    alignItems: 'center',
    columnGap: 6,
    rowGap: 8,
    width: '100%',
    height: ['108px', '88px'],
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
        '>[data-decide] >button': { opacity: 1, transition: 'opacity 150ms ease-in-out, color 150ms ease-in-out' },
      },
    },
  },
  open: {
    variant: 'button.reset',
    position: 'absolute',
    inset: '0px',
    cursor: 'pointer',
    ':focus-visible': {
      outline: '1px solid',
      outlineColor: 'grayDarkest',
      outlineOffset: '-1px',
    },
  },
  // Hovering the row fades the icons in; they linger 300ms after the pointer leaves.
  // A click on the empty part of their zone opens the card like the rest of the row.
  decide: {
    gridArea: 'decide',
    alignSelf: 'stretch',
    display: ['none', 'flex'],
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    width: '12em',
    marginY: -8,
    pointerEvents: 'auto',
    cursor: 'pointer',
    '>button': {
      variant: 'button.reset',
      display: 'flex',
      padding: 10,
      color: 'grayDarkest',
      cursor: 'pointer',
      opacity: 0,
      transition: 'opacity 200ms ease-in-out 300ms, color 150ms ease-in-out',
      '&[data-verdict=accept]:hover:not(:disabled), &[data-verdict=accept]:focus-visible': {
        color: 'primary',
      },
      '&[data-verdict=refuse]:hover:not(:disabled), &[data-verdict=refuse]:focus-visible': {
        color: 'text',
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

export const UIGroupTitle = ({ group, emoji, label, count, open, onToggle, menu = null, ...props }) => (
  <h6 {...props} sx={UIGroupTitle.styles.element}>
    <button type='button' onClick={onToggle} aria-expanded={open} sx={UIGroupTitle.styles.toggle}>
      <Icon value='chevron' direction={false} width='0.625em' height='0.625em' style={{ transform: open ? 'none' : 'rotate(-90deg)' }} />
      <span>{emojize(emoji, label)}</span>
      <code>{count}</code>
    </button>
    {menu}
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
    '>button[data-menu]': {
      variant: 'button.reset',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '2.5rem',
      position: 'relative',
      cursor: 'pointer',
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
      opacity: 0,
      transition: 'opacity 200ms ease-in-out',
    },
    ':hover, :focus-within': {
      '>button[data-menu]': {
        opacity: 1,
      },
    },
    '@media (hover: none)': {
      '>button[data-menu]': {
        opacity: 1,
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
