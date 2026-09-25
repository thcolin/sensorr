import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Badge, EpisodeStatus, EpisodeStatusOptions, Icon, Progress, ProgressPill } from '@sensorr/ui'
import { episodeStatus, progressOf } from '@sensorr/sensorr'
import { Release, ReleaseAxis, ReleaseSize } from '../../../components/Sensorr/Release'
import { useDeviceContext } from '../../../contexts/Device/Device'
import { useTMDBRequest } from '../../../store/tmdb'
import { ReleasesStyles } from '../../Details/components/Releases'
import { Follow } from './Follow'
import { Proposal } from './Proposals'
import { fileMetaOf, sizeOf } from './fills'

const THRESHOLD = 60

const pad = (number) => String(number).padStart(2, '0')

// Wide enough for a pill of four digits on each side. The last two columns, the gap between them and the
// right inset are those of an episode row (`UIEpisodes.styles.row`): the check sits in its state column, the follows align
const SUMMARY = ['5.5em minmax(0, 1fr) 1.25em 1.25em', '6.5em 10em 1.5em 1.5em']
const GAP = [6, 4]

const pendingOf = (proposals, season: number) => proposals.filter(({ release }) => (release.coverage || []).some(unit => unit.season === season))

const NONE = []

// Of the axes a release row tags, the ones an episode row has room for
const FILED = ['encoding', 'resolution', 'language']

// A background from edge to edge of the releases block, whose `overflow: hidden` clips it, whatever the insets
// of the list. A virtualized season clips it to its own scroll box
const bleed = {
  position: 'relative',
  isolation: 'isolate',
  '::before': {
    content: '""',
    position: 'absolute',
    zIndex: -1,
    // In units: a bare 0 is the first step of the space scale, 2em
    top: '0px',
    bottom: '0px',
    left: '-100vmax',
    right: '-100vmax',
    transition: 'background-color 200ms ease-in-out',
  },
}

// `proposals` are the rows of `useProposals` (Proposals.tsx), each one shown where it applies: under "All seasons",
// atop its season's drawer, or in its episode's unfolded row
const UISeasons = ({ entity, episodes, proposals = NONE, policy = null, answer = null, inLibrary, ready, followEpisodes, ...props }) => {
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
        year: number !== 0 && (summary.air_date || list[0]?.air_date) ? new Date(summary.air_date || list[0]?.air_date).getFullYear() : null,
        count: inLibrary ? list.length : (summary.episode_count || 0),
        episodes: list,
        progress: progressOf(list),
        // Counted in proposals, like the show's summary: a pack proposed for six episodes is one decision
        proposed: pendingOf(proposals, number).length,
        wanted: statuses.filter(status => status === 'wanted').length,
        monitored: !!list.length && list.every(({ monitored }) => monitored),
      }
    })
  }, [entity?.seasons, episodes, proposals, inLibrary])

  const totals = useMemo(() => {
    const list = (episodes || []).filter(({ season_number }) => season_number !== 0)
    return { count: list.length, progress: progressOf(list), size: sizeOf(episodes || []) }
  }, [episodes])

  // Episodes a pending proposal covers: on an owned one, the file it would replace is marked
  const replaced = useMemo(() => new Set(proposals.flatMap(({ release }) => (release.coverage || []).map(({ season, episode }) => `${season}:${episode}`))), [proposals])

  // An episode or a season the page does not list, or lists without an episode, sends its proposal one level up
  const placed = useMemo(() => {
    const numbers = new Set(seasons.filter(({ count }) => count).map(({ number }) => number))
    const known = new Set((episodes || []).map(({ season_number, episode_number }) => `${season_number}:${episode_number}`))
    const placed = { show: [], seasons: {}, episodes: {} }

    proposals.forEach(row => {
      const { season, episode } = row.place

      if (season === null || !numbers.has(season)) {
        placed.show.push(row)
      } else if (episode === null || !known.has(`${season}:${episode}`)) {
        (placed.seasons[season] ||= []).push(row)
      } else {
        (placed.episodes[`${season}:${episode}`] ||= []).push(row)
      }
    })

    return placed
  }, [proposals, seasons, episodes])

  const regular = seasons.filter(({ number }) => number !== 0)
  const { hash, key: navigation } = useLocation()
  const target = Number(/^#season-(\d+)$/.exec(hash)?.[1] ?? NaN)

  // The targeted season alone, else the ones waiting on something, else the last one with episodes
  const defaults = useMemo(() => {
    if (Number.isInteger(target)) {
      return new Set([target])
    }

    const waiting = seasons.filter(({ proposed, wanted }) => proposed || wanted).map(({ number }) => number)
    const filled = seasons.filter(({ count }) => count)
    return new Set(waiting.length ? waiting : [(filled.filter(({ number }) => number !== 0).pop() || filled[0])?.number])
  }, [target, seasons])

  const [open, setOpen] = useState({})
  // An episode a proposal waits on is unfolded until folded by hand
  const [unfolded, setUnfolded] = useState({})
  const scrolled = useRef(null)
  // A season without an episode has no drawer
  const openedOf = ({ number, count }) => !!count && (open[number] ?? defaults.has(number))

  // A new navigation, even to the same anchor, resets what was opened by hand
  useEffect(() => {
    setOpen({})
    setUnfolded({})
  }, [entity?.id, navigation])

  // The A and R keys answer the first proposal shown, its buttons announce them (Proposals.tsx)
  const first = [
    ...placed.show,
    ...seasons.filter(openedOf).flatMap(({ number, episodes }) => [
      ...(placed.seasons[number] || []),
      ...episodes.filter(({ id }) => unfolded[id] ?? true).flatMap(({ episode_number }) => placed.episodes[`${number}:${episode_number}`] || []),
    ]),
  ][0]?.release.id

  useEffect(() => {
    const key = `${entity?.id}${navigation}`

    if (Number.isInteger(target) && ready && scrolled.current !== key && seasons.some(({ number }) => number === target)) {
      // Two frames: the page restores its saved scroll position on the next one, after this effect
      requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById(`season-${target}`)?.scrollIntoView({ block: 'start' })))
      scrolled.current = key
    }
  }, [entity?.id, navigation, ready, seasons])

  if (!seasons.length) {
    return null
  }

  const years = regular.map(({ year }) => year).filter(Boolean)
  const toggle = (number, opened) => (e) => !e.target.closest('[data-follow]') && setOpen(open => ({ ...open, [number]: !opened }))
  const block = (row) => <Proposal key={row.release.id} row={row} policy={policy} answer={answer} shortcuts={row.release.id === first} reach={true} />

  return (
    <section sx={ReleasesStyles.element} aria-labelledby={`seasons-${entity.id}`}>
      <div>
        <div sx={UISeasons.styles.list}>
          <div sx={{ ...UISeasons.styles.head, ...UISeasons.styles.header }}>
            <div sx={UISeasons.styles.label}>
              <h2 id={`seasons-${entity.id}`}>All seasons</h2>
              {inLibrary ? (
                <>
                  <small>{totals.count} episodes</small>
                  {!!totals.size && <ReleaseSize size={totals.size} data-size={true} />}
                </>
              ) : (
                <small>
                  {[
                    `${regular.length} season${regular.length > 1 ? 's' : ''}`,
                    `${regular.reduce((sum, { count }) => sum + count, 0)} episodes`,
                    !!years.length && [...new Set([Math.min(...years), Math.max(...years)])].join('–'),
                  ].filter(Boolean).join(' · ')}
                </small>
              )}
            </div>
            {inLibrary && (
              <div sx={UISeasons.styles.summary}>
                <ProgressPill {...totals.progress} />
                <Bar progress={totals.progress} />
                <Complete progress={totals.progress} />
                <span />
              </div>
            )}
          </div>
          {placed.show.map(block)}
          {seasons.map(season => {
            const opened = openedOf(season)
            const id = `season-${entity.id}-${season.number}`
            const specials = season.number === 0
            const empty = !season.count
            const title = (
              <>
                <Icon
                  value='chevron'
                  direction={false}
                  width='0.75em'
                  height='0.75em'
                  sx={{ ...UISeasons.styles.chevron, transform: opened ? 'rotate(0deg)' : 'rotate(-90deg)', visibility: empty ? 'hidden' : 'visible' }}
                />
                <strong>{season.name}</strong>
                {/* Announced without an episode: the status a poster gives a show that has not aired (ShowProgress) */}
                <small>
                  {empty ? EpisodeStatusOptions.upcoming.label : `${season.count} episodes`}{season.year ? ` · ${season.year}` : ''}
                  {specials && !!season.progress.owned && ` · ${season.progress.owned} owned`}
                </small>
                {!!season.proposed && (
                  <Badge emoji={EpisodeStatusOptions.proposed.emoji} label={season.proposed} compact={true} size='small' title={`${season.proposed} pending proposal${season.proposed > 1 ? 's' : ''}`} data-count={true} />
                )}
                {!!season.wanted && (
                  <Badge emoji={EpisodeStatusOptions.wanted.emoji} label={season.wanted} compact={true} size='small' title={`${season.wanted} wanted`} data-count={true} />
                )}
              </>
            )

            return (
              <div key={season.number} id={`season-${season.number}`} sx={UISeasons.styles.season} data-opened={opened}>
                {/* The whole row opens the drawer, but its follow: a click on the title button bubbles up to it */}
                <div sx={{ ...UISeasons.styles.head, ...(empty ? {} : UISeasons.styles.drawer) }} onClick={empty ? undefined : toggle(season.number, opened)}>
                  {empty ? (
                    <div sx={{ ...UISeasons.styles.label, ...UISeasons.styles.toggle, cursor: 'default' }} data-specials={specials}>{title}</div>
                  ) : (
                    <button
                      type='button'
                      aria-expanded={opened}
                      aria-controls={id}
                      sx={{ ...UISeasons.styles.label, ...UISeasons.styles.toggle }}
                      data-specials={specials}
                    >
                      {title}
                    </button>
                  )}
                  {/* Nothing is owned nor followed before the show is in the library */}
                  {inLibrary && (
                    <div sx={UISeasons.styles.summary}>
                      {/* Specials are not followed by default: owned over aired would read as a gap. An empty season has nothing to count */}
                      {(specials || empty) ? <><span /><span /><span /></> : (
                        <>
                          <ProgressPill {...season.progress} />
                          <Bar progress={season.progress} />
                          <Complete progress={season.progress} />
                        </>
                      )}
                      <Follow
                        checked={season.monitored}
                        disabled={!ready || !season.episodes.length}
                        title={season.monitored ? `Every episode of ${season.name} followed` : `Follow every episode of ${season.name}`}
                        name={`Follow every episode of ${season.name}`}
                        onChange={value => followEpisodes(season.episodes.map(({ id }) => id), value)}
                      />
                    </div>
                  )}
                </div>
                {opened && (
                  <div id={id} sx={UISeasons.styles.opened}>
                    {(placed.seasons[season.number] || NONE).map(block)}
                    {inLibrary ? (
                      <Episodes
                        show={entity.id}
                        episodes={season.episodes}
                        replaced={replaced}
                        ready={ready}
                        followEpisodes={followEpisodes}
                        unfolded={unfolded}
                        setUnfolded={setUnfolded}
                        placed={placed.episodes}
                        policy={policy}
                        answer={answer}
                        first={first}
                      />
                    ) : (
                      <RemoteEpisodes show={entity.id} season={season.number} unfolded={unfolded} setUnfolded={setUnfolded} />
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

const Bar = ({ progress }) => (
  <div>
    <Progress value={progress.owned} max={progress.aired} />
  </div>
)

const Complete = ({ progress }) => (progress.aired > 0 && progress.owned >= progress.aired) ? (
  <span title='Every aired episode owned' data-complete={true}>
    <Icon value='check' width='1em' height='1em' />
  </span>
) : <span />

UISeasons.styles = {
  // Inside the movie's releases block (ReleasesStyles), the rows start and end where a release row does: its
  // inset (Release.tsx `wrapper`) is 1.5em and 2em at its font size 6, 0.75em
  list: {
    paddingLeft: [12, '1.125em'],
    paddingRight: [12, '1.5em'],
  },
  // A filet a step off the block between closed seasons; an opened one ends on its drawer
  season: {
    borderBottom: '1px solid',
    borderColor: 'grayLight',
    '&[data-opened="true"]': {
      borderColor: 'transparent',
    },
  },
  // The drawer of an opened season, its proposals and its episodes: a step darker than the block, edge to edge
  opened: {
    ...bleed,
    paddingBottom: 8,
    '::before': {
      ...bleed['::before'],
      backgroundColor: 'grayLightest',
    },
  },
  head: {
    display: 'flex',
    flexDirection: ['column', 'row'],
    alignItems: ['stretch', 'center'],
    gap: [10, 4],
    paddingY: 8,
  },
  header: {
    marginBottom: 4,
    '>div:first-of-type': {
      paddingX: 8,
    },
  },
  // Hovered across the whole block, a step darker like a release row (Release.tsx `wrapper`)
  drawer: {
    ...bleed,
    cursor: 'pointer',
    '&:hover::before': {
      backgroundColor: 'grayLightest',
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
    // At the size of a release row, whose tags it is
    '>[data-size]': {
      fontSize: 6,
      whiteSpace: 'nowrap',
    },
    '>[data-count]': {
      alignSelf: 'center',
      flexShrink: 0,
    },
    '&[data-specials="true"] >strong': {
      fontWeight: 'semibold',
      color: 'grayDarkest',
    },
  },
  toggle: {
    variant: 'button.reset',
    paddingY: 8,
    paddingX: 8,
    textAlign: 'left',
    color: 'text',
    borderRadius: '0.25em',
    cursor: 'pointer',
    ':focus-visible': {
      outline: '1px solid',
      outlineColor: 'grayDarkest',
      outlineOffset: '2px',
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
    columnGap: GAP,
    paddingX: 8,
    '>:first-child': {
      justifySelf: 'end',
      fontVariantNumeric: 'tabular-nums',
    },
    '>[data-complete]': {
      display: 'flex',
      justifySelf: 'center',
      color: 'success',
    },
    '>:last-child': {
      justifySelf: 'end',
    },
  },
}

export const Seasons = memo(UISeasons)

// `readonly` for a show out of the library: its episodes from TMDB, nothing owned nor followed
const UIEpisodes = ({ show, episodes, replaced = null, ready = false, followEpisodes = null, unfolded, setUnfolded, placed = null, policy = null, answer = null, first = null, readonly = false }) => {
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
    <div ref={ref} sx={virtual ? UIEpisodes.styles.virtual : undefined}>
      <div style={virtual ? { position: 'relative', height: virtualizer.getTotalSize() } : {}}>
        {rows.map(({ index, start }) => {
          const episode = episodes[index]
          const status = readonly ? null : episodeStatus(episode)
          const synopsis = `synopsis-${show}-${episode.id}`
          const proposals = placed?.[`${episode.season_number}:${episode.episode_number}`] || NONE
          const files = readonly ? NONE : (episode.files || NONE)
          const foldable = !!episode.overview || !!files.length || !!proposals.length
          const opened = foldable && (unfolded[episode.id] ?? !!proposals.length)
          const toggle = () => setUnfolded(unfolded => ({ ...unfolded, [episode.id]: !opened }))

          return (
            <div
              key={episode.id}
              data-index={index}
              ref={virtual ? virtualizer.measureElement : null}
              sx={UIEpisodes.styles.item}
              data-foldable={foldable}
              style={virtual ? { position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${start}px)` } : {}}
            >
              <div
                sx={UIEpisodes.styles.row}
                data-foldable={foldable}
                data-readonly={readonly}
                onClick={foldable ? (e: any) => !e.target.closest('[data-follow]') && toggle() : undefined}
              >
                <code>E{pad(episode.episode_number)}</code>
                {foldable ? (
                  <button type='button' data-title={true} aria-expanded={opened} aria-controls={synopsis} title={episode.name}>
                    {episode.name}
                  </button>
                ) : (
                  <span data-title={true} title={episode.name}>{episode.name}</span>
                )}
                {!readonly && <File file={episode.files?.[0]} replaced={replaced.has(`${episode.season_number}:${episode.episode_number}`)} />}
                <time dateTime={episode.air_date ? new Date(episode.air_date).toISOString().slice(0, 10) : undefined}>
                  {episode.air_date ? new Date(episode.air_date).toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' }) : 'TBA'}
                </time>
                {/* The follow already says an episode is not followed: the empty cell keeps the grid columns */}
                {!readonly && (status === 'unmonitored' ? <span /> : <EpisodeStatus value={status} size='small' compact={true} />)}
                {!readonly && (
                  <Follow
                    checked={!!episode.monitored}
                    disabled={!ready}
                    title={episode.monitored ? `Episode ${pad(episode.episode_number)} followed` : `Follow episode ${pad(episode.episode_number)}`}
                    name={`Follow episode ${pad(episode.episode_number)}`}
                    onChange={value => followEpisodes([episode.id], value)}
                  />
                )}
              </div>
              {opened && (
                <div id={synopsis} sx={UIEpisodes.styles.synopsis}>
                  {!!episode.overview && <p>{episode.overview}</p>}
                  {!!files.length && <Files files={files} policy={policy} />}
                  {proposals.map(row => (
                    <Proposal key={row.release.id} row={row} policy={policy} answer={answer} shortcuts={row.release.id === first} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// A season of a show out of the library, fetched from TMDB when its drawer opens
const UIRemoteEpisodes = ({ show, season, unfolded, setUnfolded }) => {
  const { loading, error, data } = useTMDBRequest(`tv/${show}/season/${season}`, {}, { transform: (data) => data })

  if (loading || error || !data.episodes?.length) {
    return (
      <p sx={UIEpisodes.styles.status}>
        {loading ? 'Loading the episodes…' : error ? `Unable to load the episodes: ${error.message}` : 'No episode announced yet'}
      </p>
    )
  }

  return <Episodes show={show} episodes={data.episodes} unfolded={unfolded} setUnfolded={setUnfolded} readonly={true} />
}

const RemoteEpisodes = memo(UIRemoteEpisodes)

const UIFile = ({ file, replaced = false }) => {
  const meta = useMemo(() => file ? fileMetaOf(file) : null, [file?.original, file?.title])

  if (!file) {
    return <span data-file={true} />
  }

  return (
    <span data-file={true} title={file.original || file.title}>
      {replaced && (
        <Badge emoji={EpisodeStatusOptions.proposed.emoji} size='normal' role='img' aria-label='Replaced by a pending proposal' title='Replaced by a pending proposal' />
      )}
      {FILED.map(axis => !!meta?.[axis] && <ReleaseAxis key={axis} axis={axis} value={meta[axis]} />)}
      {!!file.size && <ReleaseSize size={file.size} data-size={true} />}
    </span>
  )
}

const File = memo(UIFile)

// The owned files of an unfolded episode, scored and laid out like the owned releases of a movie (Details/components/Releases.tsx)
const UIFiles = ({ files, policy }) => {
  const { device } = useDeviceContext()
  const releases = useMemo(() => {
    const read = files.map(file => ({ ...file, meta: fileMetaOf(file) }))
    return policy ? policy.apply(read, null) : read
  }, [files, policy])

  return (
    <>
      {releases.map(release => (
        <Release
          key={release.id}
          entity={{ ...release, valid: true, from: release.from || 'record' }}
          compact={true}
          display={device === 'mobile' ? 'column' : 'row'}
          actions={false}
        />
      ))}
    </>
  )
}

const Files = memo(UIFiles)

UIEpisodes.styles = {
  virtual: {
    maxHeight: '32em',
    overflowY: 'auto',
    overscrollBehavior: 'contain',
    borderTop: '1px solid',
    borderColor: 'grayLighter',
  },
  // On the drawer, a filet of the block's tone. Hovered whole, its synopsis and releases with its row, a step
  // darker again; the row alone folds it
  item: {
    ...bleed,
    borderBottom: '1px solid',
    borderColor: 'grayLighter',
    '&:last-of-type': {
      borderBottom: 'none',
    },
    '&[data-foldable="true"]:hover::before': {
      backgroundColor: 'white',
    },
  },
  status: {
    margin: 12,
    paddingX: 8,
    paddingBottom: 4,
    paddingLeft: ['3.75em', '5em'],
    fontSize: 6,
    color: 'grayDarkest',
  },
  row: {
    display: 'grid',
    // The state is a round badge, compact on every size: its label is its title and its name
    gridTemplateColumns: ['2.5em minmax(0, 1fr) 1.25em 1.25em', '3.5em minmax(0, 1fr) auto 6.5em 1.5em 1.5em'],
    alignItems: 'center',
    columnGap: GAP,
    rowGap: 8,
    paddingY: [8, 12],
    minHeight: '3em',
    paddingX: 8,
    // A row out of the library has neither file, state nor follow
    '&[data-readonly="true"]': {
      gridTemplateColumns: ['2.5em minmax(0, 1fr)', '3.5em minmax(0, 1fr) 6.5em'],
    },
    '&[data-foldable="true"]': {
      cursor: 'pointer',
      ':hover >button[data-title]': {
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
    '>time': {
      display: ['none', 'block'],
      fontFamily: 'monospace',
      fontSize: 6,
      color: 'grayDarkest',
      fontVariantNumeric: 'tabular-nums',
      whiteSpace: 'nowrap',
      textAlign: 'right',
    },
    // The tags of a release row, at its size and spacing. On a phone, a line of their own under the title,
    // like a movie's release in `display='column'`
    '>[data-file]': {
      display: 'flex',
      gridColumn: ['2 / -1', 'auto'],
      gridRow: [2, 'auto'],
      alignItems: 'center',
      justifyContent: ['flex-start', 'flex-end'],
      gap: 6,
      fontSize: 6,
      whiteSpace: 'nowrap',
      '&:empty': {
        display: ['none', 'flex'],
      },
      // One width for every size up to `999.99 MB`, so the tags before it stay in columns from a row to the next
      '>[data-size] >code': {
        display: 'inline-block',
        minWidth: '9.75em',
        textAlign: 'center',
      },
    },
    '&[data-readonly="false"] >:nth-last-child(2), >:last-child': {
      justifySelf: 'end',
    },
  },
  synopsis: {
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
