import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { EpisodeStatus, Icon, Progress } from '@sensorr/ui'
import { episodeStatus, progressOf } from '@sensorr/sensorr'
import { useDeviceContext } from '../../../contexts/Device/Device'
import { Toggle } from './Toggle'

const THRESHOLD = 60

const pad = (number) => String(number).padStart(2, '0')

const UISeasons = ({ entity, episodes, inLibrary, ready, setEpisodesMetadata, ...props }) => {
  const seasons = useMemo(() => {
    const summaries = entity?.seasons || []
    const numbers = [...new Set([...summaries.map(({ season_number }) => season_number), ...(episodes || []).map(({ season_number }) => season_number)])]
      .sort((a, b) => (Number(a === 0) - Number(b === 0)) || (a - b))

    return numbers.map(number => {
      const summary = summaries.find(({ season_number }) => season_number === number) || {}
      const list = (episodes || []).filter(({ season_number }) => season_number === number).sort((a, b) => a.episode_number - b.episode_number)

      return {
        number,
        name: summary.name || (number === 0 ? 'Specials' : `Season ${number}`),
        year: (summary.air_date || list[0]?.air_date) ? new Date(summary.air_date || list[0]?.air_date).getFullYear() : null,
        count: inLibrary ? list.length : (summary.episode_count || 0),
        episodes: list,
        progress: progressOf(list),
        monitored: !!list.length && list.every(({ monitored }) => monitored),
      }
    })
  }, [entity?.seasons, episodes, inLibrary])

  const last = seasons.filter(({ number }) => number !== 0).pop()?.number ?? seasons[0]?.number
  const [open, setOpen] = useState({})

  useEffect(() => {
    setOpen({})
  }, [entity?.id])

  if (!seasons.length) {
    return null
  }

  return (
    <section sx={UISeasons.styles.element} aria-label='Seasons'>
      <div>
        {seasons.map(season => {
          const opened = inLibrary && (open[season.number] ?? season.number === last)
          const id = `season-${entity.id}-${season.number}`
          const Head = inLibrary ? 'button' : 'div'

          return (
            <div key={season.number} sx={UISeasons.styles.season}>
              <div sx={UISeasons.styles.head}>
                <Head
                  {...(inLibrary ? {
                    type: 'button',
                    'aria-expanded': opened,
                    'aria-controls': id,
                    onClick: () => setOpen(open => ({ ...open, [season.number]: !opened })),
                  } : {})}
                  sx={UISeasons.styles.toggle}
                >
                  {inLibrary && <Icon value='chevron' direction={opened} width='0.75em' height='0.75em' />}
                  <strong>{season.name}</strong>
                  <small>{season.count} episodes{season.year ? ` · ${season.year}` : ''}</small>
                </Head>
                {inLibrary && (
                  <div sx={UISeasons.styles.summary}>
                    <code title={`${season.progress.owned} of ${season.progress.aired} aired episodes owned`}>{season.progress.owned}/{season.progress.aired}</code>
                    <div>
                      <Progress value={season.progress.owned} max={season.progress.aired} />
                    </div>
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
  season: {
    borderBottom: '1px solid',
    borderColor: 'grayDark',
  },
  head: {
    display: 'flex',
    flexDirection: ['column', 'row'],
    alignItems: ['stretch', 'center'],
    gap: [8, 4],
    paddingY: 8,
  },
  toggle: {
    variant: 'button.reset',
    flex: 1,
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
    minWidth: 0,
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
    '>svg': {
      flexShrink: 0,
      alignSelf: 'center',
    },
    '>strong': {
      fontFamily: 'heading',
      fontWeight: 'strong',
      fontSize: 4,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    '>small': {
      fontSize: 6,
      color: 'grayDarkest',
      whiteSpace: 'nowrap',
    },
  },
  summary: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    paddingX: 8,
    '>code': {
      fontFamily: 'monospace',
      fontSize: 6,
      color: 'text',
      fontVariantNumeric: 'tabular-nums',
      minWidth: '5.5em',
      textAlign: 'right',
    },
    '>div': {
      flex: ['1', '0 0 10em'],
    },
  },
}

export const Seasons = memo(UISeasons)

const UIEpisodes = ({ id, show, episodes, ready, setEpisodesMetadata }) => {
  const { device } = useDeviceContext()
  const ref = useRef(null)
  const virtual = episodes.length > THRESHOLD

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

          return (
            <div
              key={episode.id}
              data-index={index}
              ref={virtual ? virtualizer.measureElement : null}
              sx={UIEpisodes.styles.row}
              style={virtual ? { position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${start}px)` } : {}}
            >
              <code>E{pad(episode.episode_number)}</code>
              <span title={episode.name}>{episode.name}</span>
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
          )
        })}
      </div>
    </div>
  )
}

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
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: [6, 4],
    minHeight: '3em',
    paddingX: 8,
    borderBottom: '1px solid',
    borderColor: 'gray',
    transition: 'background-color 200ms ease-in-out',
    ':hover': {
      backgroundColor: 'grayLighter',
    },
    '&:last-of-type': {
      borderBottom: 'none',
    },
    '>code': {
      flexShrink: 0,
      minWidth: '3.5em',
      fontFamily: 'monospace',
      fontSize: 6,
      color: 'grayDarkest',
      fontVariantNumeric: 'tabular-nums',
    },
    '>span': {
      flex: 1,
      minWidth: 0,
      fontSize: 5,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    '>time': {
      flexShrink: 0,
      display: ['none', 'block'],
      fontFamily: 'monospace',
      fontSize: 6,
      color: 'grayDarkest',
      fontVariantNumeric: 'tabular-nums',
    },
  },
}

const Episodes = memo(UIEpisodes)
