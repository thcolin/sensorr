import { Fragment, memo, useEffect, useMemo, useState } from 'react'
import { Button, Icon, Link, Picture, transformMovieDetails } from '@sensorr/ui'
import { emojize, filesize } from '@sensorr/utils'
import { useTMDB } from '../../store/tmdb'
import { useWikiData } from '../../store/wikidata'
import { withMovieMetadataContext } from '../../contexts/MoviesMetadata/MoviesMetadata'
import { Metadata } from '../Details/components/Metadata'
import { Externals, Meaningful } from '../Details/components/Externals'
import { Transition } from '../../components/Sensorr/Proposal'
import { MovieWithCreditsAndReviews } from '../../components/Movie/Movie'
import { ReleaseState, Statistic, safeUrl } from '../../components/Sensorr/Release'

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

const UIReleaseLine = ({ release, heaviest }) => (
  <div sx={UIReleaseLine.styles.element}>
    <ReleaseState entity={release} />
    <span sx={UIReleaseLine.styles.name}>
      <code title={release.original}>{(release.title || '').split('.').map((part, index, parts) => <Fragment key={index}>{part}{index < parts.length - 1 && <>.<wbr /></>}</Fragment>)}</code>
      {!!release.znab && (
        <>
          <a href={safeUrl(release.link)} target='_blank' rel='noreferrer noopener' sx={{ color: 'primary' }}><code><small>({release.znab})</small></code></a>
          <a href={safeUrl(release.enclosure)} target='_blank' rel='noreferrer noopener' sx={{ color: 'grayDarker' }} title='Download .torrent file'><code><small>.torrent</small></code></a>
        </>
      )}
    </span>
    <Statistic emoji='📦' title={`Size (${filesize.stringify(release.size || 0)})`} ratio={Math.min(1, Math.max(0.01, (release.size || 0) / (heaviest || 1)))}>
      {filesize.stringify(release.size || 0)}
    </Statistic>
  </div>
)

UIReleaseLine.styles = {
  element: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: ['wrap', 'nowrap'],
    gap: 8,
    fontSize: 6,
    '>span:first-of-type': {
      marginX: -4,
    },
    '>div:last-child': {
      flexBasis: ['100%', 'auto'],
    },
  },
  name: {
    flex: 1,
    minWidth: 0,
    display: 'inline-flex',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    columnGap: 8,
    '>code': {
      overflowWrap: 'anywhere',
    },
    'a': {
      opacity: 0.8,
      ':hover': {
        opacity: 1,
      },
    },
  },
}

const ReleaseLine = memo(UIReleaseLine)

const GESTURES = [
  { verdict: 'accept', key: 'A', label: 'Accept', variant: 'contain' },
  { verdict: 'refuse', key: 'R', label: 'Refuse', variant: 'outline' },
] as const

const UIGestures = ({ onGesture, disabled = false, ...props }) => (
  <div {...props} sx={UIGestures.styles.element}>
    {GESTURES.map(({ verdict, key, label, variant }) => (
      <Button key={verdict} variant={variant} color='primary' disabled={disabled} onClick={() => onGesture(verdict)} aria-keyshortcuts={key}>
        {label}
      </Button>
    ))}
  </div>
)

UIGestures.styles = {
  element: {
    display: 'flex',
    justifyContent: 'center',
    gap: 8,
    '>button': {
      flex: ['1', '0 1 12em'],
      ':focus-visible': {
        outline: '1px solid',
        outlineColor: 'grayDarkest',
        outlineOffset: '2px',
      },
    },
  },
}

export const Gestures = memo(UIGestures)

// Lightest owned release under the proposed one: lighter holds, heavier breaks.
const Size = ({ item, threshold }) => item.owned.length ? (
  <>
    <span>📦</span>
    <Transition
      axis='size'
      from={filesize.stringify((item.proposal?.size || 0) - (item.diff.size || 0))}
      to={filesize.stringify(item.proposal?.size || 0)}
      state={Math.abs(item.diff.size || 0) < (threshold || 1) ? 'quiet' : item.diff.size < 0 ? 'held' : 'broken'}
    />
  </>
) : <>{emojize('📦', filesize.stringify(item.proposal?.size || 0))}</>

const UIActive = ({ item, entity, metadata, setMetadata, threshold = 0, leaving = null, entering = true, mobile = false, onGesture, disabled = false, ...props }) => {
  const { movie, additional } = useDetails(item.id)
  const [others, setOthers] = useState(false)
  const [meaningful, setMeaningful] = useState(false)
  const facts = useMemo(() => transformMovieDetails({ ...entity, ...(movie || {}) }), [entity, movie])
  const lightest = item.diff.lightest
  const owned = others ? item.owned : (lightest ? [lightest] : [])
  const heaviest = Math.max(item.proposal?.size || 0, ...owned.map(({ size }) => size || 0))
  const verdict = leaving && VERDICTS[leaving]

  return (
    <article sx={{ ...UIActive.styles.element, ...(leaving ? UIActive.styles.leaving : entering ? UIActive.styles.entering : {}) }} aria-current={!leaving}>
      <div sx={UIActive.styles.collapse}>
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
            <div sx={UIActive.styles.releases} data-releases={true}>
              {owned.map(release => <ReleaseLine key={release.id} release={release} heaviest={heaviest} />)}
              {item.owned.length > 1 && (
                <button type='button' onClick={() => setOthers(!others)} sx={UIActive.styles.others} aria-expanded={others}>
                  {others ? 'Hide the other owned releases' : `${item.owned.length - 1} more owned ${item.owned.length > 2 ? 'releases' : 'release'}`}
                </button>
              )}
              {!!item.proposal && <ReleaseLine release={item.proposal} heaviest={heaviest} />}
            </div>
            {!!item.diff.rows.length && (
              <div sx={UIActive.styles.pills} data-pills={true}>
                {item.diff.rows.map(({ axis, from, to }) => (
                  <Transition key={axis} axis={axis} from={from} to={to} policy={item.policy} />
                ))}
              </div>
            )}
            {!mobile && <Gestures onGesture={onGesture} disabled={disabled || !!leaving} data-gestures={true} />}
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
  card: {
    display: 'flex',
    flexDirection: ['column', 'row'],
    alignItems: 'stretch',
    gap: 4,
    paddingX: 4,
    paddingY: 4,
    borderBottom: '1px solid',
    borderColor: 'gray',
  },
  // Movie's poster sizes itself, badges included, as on every other page.
  poster: {
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
    '>div[data-pills]': {
      order: [2, 'initial'],
    },
    '>div[data-gestures]': {
      marginTop: 'auto',
      paddingTop: 8,
    },
  },
  head: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 4,
    '>h3': {
      margin: 12,
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
  skeleton: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    '>span': {
      display: 'block',
      height: '2em',
      width: '32em',
      maxWidth: '100%',
      backgroundColor: 'grayLight',
      borderRadius: '0.25em',
    },
  },
  releases: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    paddingY: 8,
    borderTop: '1px solid',
    borderColor: 'gray',
  },
  others: {
    variant: 'button.reset',
    alignSelf: 'flex-start',
    color: 'grayDarker',
    fontFamily: 'monospace',
    fontSize: 7,
    cursor: 'pointer',
    ':hover': {
      color: 'text',
    },
    ':focus-visible': {
      outline: '1px solid',
      outlineColor: 'grayDarkest',
      outlineOffset: '2px',
    },
  },
  facts: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: 3,
    rowGap: 8,
  },
  pills: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    columnGap: 7,
    rowGap: 8,
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

const UICompact = ({ item, onSelect, threshold = 0, ...props }) => {
  const year = item.entity?.release_date && new Date(item.entity.release_date).getFullYear()

  return (
    <button type='button' onClick={() => onSelect(item.id)} sx={UICompact.styles.element}>
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
          <code title={item.owned.length ? `Size against the lightest owned release: ${delta(item.diff.size)}` : 'Size of the proposed release'}>
            {item.owned.length ? <Size item={item} threshold={threshold} /> : <small>{emojize('📦', filesize.stringify(item.proposal?.size || 0))}</small>}
          </code>
        </span>
      </span>
    </button>
  )
}

UICompact.styles = {
  element: {
    variant: 'button.reset',
    display: 'flex',
    alignItems: 'stretch',
    gap: 4,
    width: '100%',
    height: ['108px', '80px'],
    paddingX: 4,
    paddingY: 10,
    textAlign: 'left',
    cursor: 'pointer',
    borderBottom: '1px solid',
    borderColor: 'gray',
    transition: 'background-color 200ms ease-in-out',
    ':hover': {
      backgroundColor: 'grayLightest',
    },
    ':focus-visible': {
      outline: '1px solid',
      outlineColor: 'grayDarkest',
      outlineOffset: '-1px',
    },
  },
  poster: {
    flexShrink: 0,
    display: 'flex',
    width: '2.5em',
    '>span': { width: '100%' },
  },
  body: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 9,
  },
  title: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
    '>strong': {
      fontFamily: 'heading',
      fontWeight: 'heading',
      fontSize: 5,
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
    '>code': {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      flexShrink: 0,
      fontFamily: 'monospace',
      color: 'text',
      '>small': {
        fontSize: 7,
      },
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
