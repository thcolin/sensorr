import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useVirtualizer } from '@tanstack/react-virtual'
import oleoo from 'oleoo'
import { EpisodeStatus, EpisodeStatusOptions, Icon, Progress } from '@sensorr/ui'
import { episodeStatus, progressOf } from '@sensorr/sensorr'
import { filesize } from '@sensorr/utils'
import { useDeviceContext } from '../../../contexts/Device/Device'
import { Toggle } from './Toggle'

const THRESHOLD = 60

const pad = (number) => String(number).padStart(2, '0')

const sizeOf = (episodes) => episodes.reduce((acc, { files }) => acc + (files || []).reduce((sum, file) => sum + (file.size || 0), 0), 0)

// The tracks a season head and the header share: count, bar, completion mark, follow column
const SUMMARY = ['4em minmax(0, 1fr) 1em 2.5em', '5.5em 10em 1em 2.5em']

const UISeasons = ({ entity, episodes, inLibrary, ready, setEpisodesMetadata, ...props }) => {
  const seasons = useMemo(() => {
    const summaries = entity?.seasons || []
    const numbers = [...new Set([...summaries.map(({ season_number }) => season_number), ...(episodes || []).map(({ season_number }) => season_number)])]
      .sort((a, b) => (Number(a === 0) - Number(b === 0)) || (a - b))

    return numbers.map(number => {
      const summary = summaries.find(({ season_number }) => season_number === number) || {}
      const list = (episodes || []).filter(({ season_number }) => season_number === number).sort((a, b) => a.episode_number - b.episode_number)
      const statuses = list.map(episode => episodeStatus(episode))

      return {
        number,
        name: summary.name || (number === 0 ? 'Specials' : `Season ${number}`),
        year: (summary.air_date || list[0]?.air_date) ? new Date(summary.air_date || list[0]?.air_date).getFullYear() : null,
        count: inLibrary ? list.length : (summary.episode_count || 0),
        episodes: list,
        progress: progressOf(list),
        proposed: statuses.filter(status => status === 'proposed').length,
        wanted: statuses.filter(status => status === 'wanted').length,
        monitored: !!list.length && list.every(({ monitored }) => monitored),
      }
    })
  }, [entity?.seasons, episodes, inLibrary])

  const totals = useMemo(() => {
    const list = (episodes || []).filter(({ season_number }) => season_number !== 0)
    return { count: list.length, progress: progressOf(list), size: sizeOf(episodes || []) }
  }, [episodes])

  // The first season that waits on something opens, else the last one
  const regular = seasons.filter(({ number }) => number !== 0)
  const initial = (regular.find(({ proposed, wanted }) => proposed || wanted) || regular[regular.length - 1] || seasons[0])?.number
  // A link to `#season-N`, from a calendar row, opens that season and scrolls to it once the seasons are there
  const { hash } = useLocation()
  const target = Number(/^#season-(\d+)$/.exec(hash)?.[1] ?? NaN)
  const targeted = Number.isInteger(target) ? { [target]: true } : {}
  const [open, setOpen] = useState(targeted)
  const scrolled = useRef(null)

  useEffect(() => {
    setOpen(targeted)
  }, [entity?.id, hash])

  useEffect(() => {
    const key = `${entity?.id}${hash}`

    if (Number.isInteger(target) && ready && scrolled.current !== key && seasons.some(({ number }) => number === target)) {
      // Two frames: the page restores its saved scroll position on the next one, after this effect
      requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById(`season-${target}`)?.scrollIntoView({ block: 'start' })))
      scrolled.current = key
    }
  }, [entity?.id, hash, ready, seasons])

  if (!seasons.length) {
    return null
  }

  return (
    <section sx={UISeasons.styles.element} aria-labelledby={`seasons-${entity.id}`}>
      <div>
        {inLibrary ? (
          <div sx={{ ...UISeasons.styles.head, ...UISeasons.styles.header }}>
            <div sx={UISeasons.styles.label}>
              <h2 id={`seasons-${entity.id}`}>All seasons</h2>
              <small>
                {totals.count} episodes{!!totals.size && ` · ${filesize.stringify(totals.size)}`}
              </small>
            </div>
            <div sx={UISeasons.styles.summary}>
              <Count progress={totals.progress} />
              <Bar progress={totals.progress} />
              <Complete progress={totals.progress} />
              <span aria-hidden={true}>Follow</span>
            </div>
          </div>
        ) : (
          <h2 id={`seasons-${entity.id}`} sx={UISeasons.styles.hidden}>Seasons</h2>
        )}
        {seasons.map(season => {
          const opened = inLibrary && (open[season.number] ?? season.number === initial)
          const id = `season-${entity.id}-${season.number}`
          const Head = inLibrary ? 'button' : 'div'

          return (
            <div key={season.number} id={`season-${season.number}`} sx={UISeasons.styles.season}>
              <div sx={UISeasons.styles.head}>
                <Head
                  {...(inLibrary ? {
                    type: 'button',
                    'aria-expanded': opened,
                    'aria-controls': id,
                    onClick: () => setOpen(open => ({ ...open, [season.number]: !opened })),
                  } : {})}
                  sx={{ ...UISeasons.styles.label, ...UISeasons.styles.toggle }}
                >
                  {inLibrary && (
                    <Icon
                      value='chevron'
                      direction={false}
                      width='0.75em'
                      height='0.75em'
                      sx={{ ...UISeasons.styles.chevron, transform: opened ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                    />
                  )}
                  <strong>{season.name}</strong>
                  <small>
                    {season.count} episodes{season.year ? ` · ${season.year}` : ''}
                    {!!season.proposed && <span title={`${season.proposed} proposed`}> · {EpisodeStatusOptions.proposed.emoji} {season.proposed}</span>}
                    {!!season.wanted && <span title={`${season.wanted} wanted`}> · {EpisodeStatusOptions.wanted.emoji} {season.wanted}</span>}
                  </small>
                </Head>
                {inLibrary && (
                  <div sx={UISeasons.styles.summary}>
                    <Count progress={season.progress} />
                    <Bar progress={season.progress} />
                    <Complete progress={season.progress} />
                    <Toggle
                      id={`follow-${id}`}
                      checked={season.monitored}
                      disabled={!ready || !season.episodes.length}
                      title={`Follow every episode of ${season.name}`}
                      aria-label={`Follow every episode of ${season.name}`}
                      onChange={value => setEpisodesMetadata(entity.id, season.episodes.map(({ id }) => id), 'monitored', value)}
                    />
                  </div>
                )}
              </div>
              {opened && (
                <Episodes
                  id={id}
                  show={entity.id}
                  episodes={season.episodes}
                  ready={ready}
                  setEpisodesMetadata={setEpisodesMetadata}
                />
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

const Count = ({ progress }) => (
  <code title={`${progress.owned} of ${progress.aired} aired episodes owned`}>{progress.owned}/{progress.aired}</code>
)

const Bar = ({ progress }) => (
  <div>
    <Progress value={progress.owned} max={progress.aired} />
  </div>
)

const Complete = ({ progress }) => (progress.aired > 0 && progress.owned >= progress.aired) ? (
  <span title='Every aired episode owned' data-complete={true}>✓</span>
) : <span />

UISeasons.styles = {
  element: {
    display: 'flex',
    justifyContent: 'center',
    paddingX: [4, '5em'],
    marginY: 4,
    '>div': {
      width: '100%',
      maxWidth: '95em',
    },
  },
  hidden: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap',
  },
  season: {
    borderBottom: '1px solid',
    borderColor: 'grayDark',
  },
  head: {
    display: 'flex',
    flexDirection: ['column', 'row'],
    alignItems: ['stretch', 'center'],
    gap: [10, 4],
    paddingY: 8,
  },
  header: {
    borderBottom: '1px solid',
    borderColor: 'grayDark',
    '>div:first-of-type': {
      paddingX: 8,
    },
  },
  label: {
    flex: 1,
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
    minWidth: 0,
    '>h2, >strong': {
      margin: 12,
      fontFamily: 'heading',
      fontWeight: 'strong',
      fontSize: 4,
      lineHeight: 'body',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    '>small': {
      fontSize: 6,
      color: 'grayDarkest',
      whiteSpace: 'nowrap',
      fontVariantNumeric: 'tabular-nums',
    },
  },
  toggle: {
    variant: 'button.reset',
    paddingY: 8,
    paddingX: 8,
    textAlign: 'left',
    color: 'text',
    borderRadius: '0.25em',
    transition: 'background-color 200ms ease-in-out',
    '&:is(button)': {
      cursor: 'pointer',
      ':hover': {
        backgroundColor: 'grayLighter',
      },
      ':focus-visible': {
        outline: '1px solid',
        outlineColor: 'grayDarkest',
        outlineOffset: '2px',
      },
    },
  },
  chevron: {
    flexShrink: 0,
    alignSelf: 'center',
    transition: 'transform 200ms ease-in-out',
  },
  summary: {
    display: 'grid',
    gridTemplateColumns: SUMMARY,
    alignItems: 'center',
    columnGap: 6,
    paddingX: 8,
    '>code': {
      fontFamily: 'monospace',
      fontSize: 6,
      color: 'text',
      fontVariantNumeric: 'tabular-nums',
      textAlign: 'right',
    },
    '>[data-complete]': {
      fontSize: 6,
      lineHeight: 'reset',
      color: 'primary',
    },
    '>:last-child': {
      justifySelf: 'end',
    },
    '>span[aria-hidden]': {
      fontSize: 7,
      fontWeight: 'semibold',
      color: 'gray-600',
      whiteSpace: 'nowrap',
    },
  },
}

export const Seasons = memo(UISeasons)

const UIEpisodes = ({ id, show, episodes, ready, setEpisodesMetadata }) => {
  const { device } = useDeviceContext()
  const ref = useRef(null)
  const virtual = episodes.length > THRESHOLD
  const [unfolded, setUnfolded] = useState({})

  const virtualizer = useVirtualizer({
    count: episodes.length,
    getScrollElement: () => ref.current,
    estimateSize: () => 48,
    overscan: 10,
    enabled: virtual,
  })

  const rows = virtual ? virtualizer.getVirtualItems() : episodes.map((episode, index) => ({ index, start: 0 }))

  return (
    <div id={id} ref={ref} sx={{ ...UIEpisodes.styles.element, ...(virtual ? UIEpisodes.styles.virtual : {}) }}>
      <div style={virtual ? { position: 'relative', height: virtualizer.getTotalSize() } : {}}>
        {rows.map(({ index, start }) => {
          const episode = episodes[index]
          const status = episodeStatus(episode)
          const synopsis = `synopsis-${show}-${episode.id}`
          const foldable = !!episode.overview
          const opened = foldable && !!unfolded[episode.id]
          const toggle = () => setUnfolded(unfolded => ({ ...unfolded, [episode.id]: !unfolded[episode.id] }))

          return (
            <div
              key={episode.id}
              data-index={index}
              ref={virtual ? virtualizer.measureElement : null}
              sx={UIEpisodes.styles.item}
              style={virtual ? { position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${start}px)` } : {}}
            >
              <div
                sx={UIEpisodes.styles.row}
                data-foldable={foldable}
                onClick={foldable ? (e: any) => !e.target.closest('label, input') && toggle() : undefined}
              >
                <code>E{pad(episode.episode_number)}</code>
                {foldable ? (
                  <button type='button' data-title={true} aria-expanded={opened} aria-controls={synopsis} title={episode.name}>
                    {episode.name}
                  </button>
                ) : (
                  <span data-title={true} title={episode.name}>{episode.name}</span>
                )}
                <File file={device !== 'mobile' && episode.files?.[0]} />
                <time dateTime={episode.air_date ? new Date(episode.air_date).toISOString().slice(0, 10) : undefined}>
                  {episode.air_date ? new Date(episode.air_date).toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' }) : 'TBA'}
                </time>
                <EpisodeStatus value={status} size='small' compact={device === 'mobile'} />
                <Toggle
                  id={`follow-episode-${show}-${episode.id}`}
                  checked={!!episode.monitored}
                  disabled={!ready}
                  title={`Follow episode ${pad(episode.episode_number)}`}
                  aria-label={`Follow episode ${pad(episode.episode_number)}`}
                  onChange={value => setEpisodesMetadata(show, [episode.id], 'monitored', value)}
                />
              </div>
              {opened && (
                <div id={synopsis} sx={UIEpisodes.styles.synopsis}>
                  <p>{episode.overview}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const UIFile = ({ file }) => {
  const meta = useMemo(() => file?.title ? oleoo.parse(file.title, { strict: false, flagged: true }) : null, [file?.title])

  if (!file) {
    return <small data-file={true} />
  }

  const parts = [meta?.resolution, meta?.language, !!file.size && filesize.stringify(file.size)].filter(Boolean)

  return (
    <small data-file={true} title={file.original || file.title}>{parts.join(' · ')}</small>
  )
}

const File = memo(UIFile)

UIEpisodes.styles = {
  element: {
    paddingBottom: 8,
  },
  virtual: {
    maxHeight: '32em',
    overflowY: 'auto',
    overscrollBehavior: 'contain',
    borderTop: '1px solid',
    borderColor: 'gray',
  },
  item: {
    borderBottom: '1px solid',
    borderColor: 'gray',
    '&:last-of-type': {
      borderBottom: 'none',
    },
  },
  row: {
    display: 'grid',
    gridTemplateColumns: ['2.5em minmax(0, 1fr) auto 1em', '3.5em minmax(0, 1fr) auto 6.5em 7em 1em'],
    alignItems: 'center',
    columnGap: [6, 4],
    minHeight: '3em',
    paddingX: 8,
    '&[data-foldable="true"]': {
      cursor: 'pointer',
      ':hover >button': {
        textDecoration: 'underline',
        textUnderlineOffset: '0.25em',
      },
    },
    '>code': {
      fontFamily: 'monospace',
      fontSize: 6,
      color: 'grayDarkest',
      fontVariantNumeric: 'tabular-nums',
    },
    '>[data-title]': {
      minWidth: 0,
      fontSize: 5,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    '>button': {
      variant: 'button.reset',
      justifySelf: 'start',
      maxWidth: '100%',
      textAlign: 'left',
      color: 'text',
      cursor: 'pointer',
      ':focus-visible': {
        outline: '1px solid',
        outlineColor: 'grayDarkest',
        outlineOffset: '2px',
      },
    },
    '>[data-file], >time': {
      display: ['none', 'block'],
      fontFamily: 'monospace',
      fontSize: 6,
      color: 'grayDarkest',
      fontVariantNumeric: 'tabular-nums',
      whiteSpace: 'nowrap',
      textAlign: 'right',
    },
    '>[data-file]': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    '>:nth-last-child(2), >:last-child': {
      justifySelf: 'end',
    },
  },
  synopsis: {
    // Lined up with the title column: the code track, its gap and the row padding
    paddingLeft: ['3.75em', '5em'],
    paddingRight: 8,
    paddingBottom: 6,
    '>p': {
      maxWidth: '65ch',
      margin: 12,
      fontSize: 6,
      lineHeight: 'body',
      color: 'grayDarkest',
      textWrap: 'pretty',
    },
  },
}

const Episodes = memo(UIEpisodes)
