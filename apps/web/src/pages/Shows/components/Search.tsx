import { memo, useCallback, useMemo, useRef, useState } from 'react'
import { Badge, Icon } from '@sensorr/ui'
import { coverageLabel, manualPickOf, swapOf, unitLabel } from '@sensorr/sensorr'
import { useShowsMetadataContext } from '../../../contexts/ShowsMetadata/ShowsMetadata'
import { useSensorr } from '../../../store/sensorr'
import { Sensorr } from '../../../components/Sensorr'
import { isPending } from '../../Proposals/queue'
import { useShowPolicy } from './Actions'
import { reachOf } from './Proposals'
import { fillsOf } from './fills'

const UISearch = ({ onClick, disabled = false, title }) => (
  <button type='button' data-search={true} disabled={disabled} onClick={onClick} title={title} aria-label={title} sx={UISearch.styles.element}>
    <Badge emoji={<Icon value='search' width='1em' height='1em' />} compact={true} size='small' />
  </button>
)

UISearch.styles = {
  element: {
    variant: 'button.reset',
    display: 'flex',
    position: 'relative',
    borderRadius: '50%',
    '>span': {
      transition: 'background-color 200ms ease-in-out',
    },
    // The touch target of the follow's select, but on a phone its gap belongs to the follow on its right
    '::after': {
      content: '""',
      position: 'absolute',
      inset: ['-0.75em 0 -0.75em -0.75em', '-0.5em'],
    },
    ':hover:not(:disabled) >span': {
      backgroundColor: 'grayDark',
    },
    ':focus-visible': {
      outline: '1px solid',
      outlineColor: 'grayDarkest',
      outlineOffset: '2px',
    },
    ':disabled': {
      opacity: 0.5,
      cursor: 'default',
    },
  },
}

export const Search = memo(UISearch)

type Target = { type: 'series' | 'season' | 'episode', season?: number, episode?: number }

// The release drawer of a show, opened on one of its levels. `open` takes the releases the proposal is looked for in,
// for a caller that switches `entity` in the same gesture and would otherwise read the previous show's
export const useShowSearch = (entity, loading = false) => {
  const id = entity?.id
  const { metadata: { [id]: metadata }, episodes: { [id]: episodes }, setShowMetadata, banShowRelease, unbanShowRelease, addShow } = useShowsMetadataContext() as any
  const sensorr = useSensorr()
  const inLibrary = !!metadata && metadata.state !== 'ignored'
  const [search, setSearch] = useState({ unit: null, title: 'Releases', proposal: null })
  const toggle = useRef((e) => null)
  const policy = useShowPolicy(entity, metadata)
  const searched = useMemo(() => ({
    query: sensorr.getShowQuery(entity, metadata?.query, metadata?.banned_releases || []),
    policy,
    banned_releases: metadata?.banned_releases || [],
  }), [sensorr, entity, metadata?.query, metadata?.banned_releases, policy])

  const open = useCallback((e, target: Target = { type: 'series' }, label = 'the whole series', releases = metadata?.releases) => {
    const covers = ({ season, episode }) => (target.season === undefined || season === target.season) && (target.episode === undefined || episode === target.episode)
    const proposal = (releases || []).find(release => isPending(release) && (target.type !== 'series' || release.level !== 'episode') && (release.coverage || []).some(covers)) || null
    setSearch({ unit: { ...target, episodes: [] }, title: `Releases for ${label}`, proposal })
    toggle.current(e)
  }, [metadata?.releases])

  // A pick out of the library adds the show first, unfollowed: its episodes are where the import links the files
  const pick = useCallback(async (release) => {
    const listed = inLibrary ? episodes : await addShow(id, false)
    await setShowMetadata(id, 'release', { ...release, ...manualPickOf(release, listed), from: 'record', job: 'manual', proposal: true, choice: true })
  }, [id, inLibrary, episodes, addShow])

  // Out of the library nothing is owned yet, and the episodes a release covers are only known once the show is added
  const describe = useCallback((release) => {
    const { coverage, level, swap } = manualPickOf(release, inLibrary ? (episodes || []) : [])

    if (!coverage.length) {
      return level ? unitLabel({ type: level, season: release.meta?.seasons?.[0], episode: release.meta?.episodes?.[0], episodes: [] }) : null
    }

    return [coverageLabel(coverage, level), reachOf(fillsOf(coverage, episodes, level), swap ? swapOf(coverage, episodes) : null)].filter(Boolean).join(' · ')
  }, [inLibrary, episodes])

  const toggleBan = useCallback((title, banned) => (banned ? unbanShowRelease : banShowRelease)(id, title), [id])

  const drawer = (
    <Sensorr
      entity={entity || {}}
      loading={loading || (inLibrary && !episodes)}
      metadata={searched}
      unit={search.unit}
      title={search.title}
      proposal={search.proposal}
      describe={describe}
      onPick={pick}
      banned={searched.banned_releases}
      onBan={inLibrary ? toggleBan : false}
      setPortalToggle={(toggleOpen) => toggle.current = (e) => toggleOpen(e)}
    />
  )

  return { open, drawer }
}

// One drawer for every row of a show job, on the show whose ticket was clicked
export const ShowSearchSingleton = ({ setToggle }) => {
  const [entity, setEntity] = useState(null)
  const { metadata, episodes, loadEpisodes } = useShowsMetadataContext() as any
  const { open, drawer } = useShowSearch(entity)

  setToggle((e, show) => {
    setEntity(show)

    if (metadata[show.id] && metadata[show.id].state !== 'ignored' && !episodes[show.id]) {
      loadEpisodes(show.id).catch(() => null)
    }

    open(e, { type: 'series' }, 'the whole series', metadata[show.id]?.releases)
  })

  return drawer
}
