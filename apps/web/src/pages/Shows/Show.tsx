import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useThemeUI } from '@theme-ui/core'
import { Badge, EpisodeStatusOptions, ProgressPill, transformShowDetails, Warning } from '@sensorr/ui'
import { coverageLabel, diffusionOf, episodeStatus, manualPickOf, nextAirDateOf, progressOf, swapOf, unitLabel } from '@sensorr/sensorr'
import { useTitle } from '@sensorr/utils'
import { useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useTMDBRequest } from '../../store/tmdb'
import { useSensorr } from '../../store/sensorr'
import { showStateOf, useShowsMetadataContext } from '../../contexts/ShowsMetadata/ShowsMetadata'
import { usePersonsMetadataContext } from '../../contexts/PersonsMetadata/PersonsMetadata'
import { useScrollPositionContext } from '../../contexts/ScrollPosition/ScrollPosition'
import { withBody } from '../../layout/withLayout'
import ShowChild, { FOOTER_HEIGHT } from '../../components/Show/Show'
import Person from '../../components/Person/Person'
import { ReleaseSize } from '../../components/Sensorr/Release'
import { Sensorr } from '../../components/Sensorr'
import Details from '../Details/Details'
import { Skeleton } from '../Details/components/Skeleton'
import { ShowActions, useShowPolicy } from './components/Actions'
import { reachOf, useProposals } from './components/Proposals'
import { isPending } from '../Proposals/queue'
import { Seasons } from './components/Seasons'
import { fillsOf, sizeOf } from './components/fills'
import { aggregateCredits } from './credits'

const Show = ({ ...props }) => {
  const { restoreScrollPosition } = useScrollPositionContext()
  const { id } = useParams() as any
  const { t } = useTranslation()
  const { theme } = useThemeUI() as any
  const { metadata: persons } = usePersonsMetadataContext() as any
  const {
    loading: metadataLoading,
    metadata: { [id]: metadata },
    episodes: { [id]: episodes },
    loadEpisodes,
    setShowMetadata,
    setEpisodesMetadata,
    setShowState,
    banShowRelease,
    unbanShowRelease,
    addShow,
  } = useShowsMetadataContext() as any
  const sensorr = useSensorr()
  const [episodesError, setEpisodesError] = useState(null)

  const show = useTMDBRequest(`tv/${id}`, {
    append_to_response: 'videos,external_ids,alternative_titles,aggregate_credits,recommendations,similar,watch/providers',
    include_image_language: 'en,null',
  }, { transform: transformShowDetails })

  const inLibrary = !!metadata && metadata.state !== 'ignored'
  const state = metadataLoading ? 'loading' : showStateOf(metadata)
  // An airing show Sensorr does not follow, pinned or out of the library, draws its violet as a hollow ring
  const followed = state === 'followed'
  const ready = !show.loading && !!(show.data?.id || show.error)

  useTitle(ready && [show.details.title, show.details.year && `(${show.details.year})`].filter(part => part).join(' '))

  useEffect(() => {
    if (ready) {
      restoreScrollPosition()
    }
  }, [ready])

  useEffect(() => {
    setEpisodesError(null)

    if (!inLibrary || episodes) {
      return
    }

    loadEpisodes(Number(id)).catch(error => setEpisodesError(error))
  }, [id, inLibrary])

  const setMetadata = useCallback((key, value) => setShowMetadata(Number(id), key, value), [id])
  const proceedRelease = useCallback((release, choice) => setShowMetadata(Number(id), 'proposal', { id: release.id, choice }), [id])
  const banRelease = useCallback((release) => banShowRelease(Number(id), release.title), [id])
  // `setShowState` toasts a show it adds to or removes from the library, `setShowMetadata` nothing for a follow
  const setState = useCallback(value => setShowState(Number(id), value).catch(() => inLibrary && toast.error('Error while following the show')), [id, setShowState, inLibrary])
  // A season is a bulk and toasts its own outcome, a single episode does not
  const followEpisodes = useCallback((ids, value) => setEpisodesMetadata(Number(id), ids, 'monitored', value)
    .catch(() => ids.length === 1 && toast.error('Error while following the episode')), [id])

  const [search, setSearch] = useState({ unit: null, title: 'Releases', proposal: null })
  const toggleSearch = useRef((e) => null)
  const policy = useShowPolicy(show.data, metadata)
  const searched = useMemo(() => ({
    query: sensorr.getShowQuery(show.data, metadata?.query, metadata?.banned_releases || []),
    policy,
    banned_releases: metadata?.banned_releases || [],
  }), [sensorr, show.data, metadata?.query, metadata?.banned_releases, policy])

  const openSearch = useCallback((e, target: { type: 'series' | 'season' | 'episode', season?: number, episode?: number } = { type: 'series' }, label = 'the whole series') => {
    const covers = ({ season, episode }) => (target.season === undefined || season === target.season) && (target.episode === undefined || episode === target.episode)
    const proposal = (metadata?.releases || []).find(release => isPending(release) && (target.type !== 'series' || release.level !== 'episode') && (release.coverage || []).some(covers)) || null
    setSearch({ unit: { ...target, episodes: [] }, title: `Releases for ${label}`, proposal })
    toggleSearch.current(e)
  }, [metadata?.releases])

  // A pick out of the library adds the show first, unfollowed: its episodes are where the import links the files
  const pickRelease = useCallback(async (release) => {
    const listed = inLibrary ? episodes : await addShow(Number(id), false)
    await setShowMetadata(Number(id), 'release', { ...release, ...manualPickOf(release, listed), from: 'record', job: 'manual', proposal: true, choice: true })
  }, [id, inLibrary, episodes, addShow])

  // Out of the library nothing is owned yet, and the episodes a release covers are only known once the show is added
  const describeRelease = useCallback((release) => {
    const { coverage, level, swap } = manualPickOf(release, inLibrary ? (episodes || []) : [])

    if (!coverage.length) {
      return level ? unitLabel({ type: level, season: release.meta?.seasons?.[0], episode: release.meta?.episodes?.[0], episodes: [] }) : null
    }

    return [coverageLabel(coverage, level), reachOf(fillsOf(coverage, episodes, level), swap ? swapOf(coverage, episodes) : null)].filter(Boolean).join(' · ')
  }, [inLibrary, episodes])

  const toggleBan = useCallback((title, banned) => (banned ? unbanShowRelease : banShowRelease)(Number(id), title), [id])

  const proposals = useProposals({ entity: show.data, metadata, episodes: inLibrary ? (episodes || null) : null, proceedRelease, banRelease })

  const progress = useMemo(() => (inLibrary && episodes) ? progressOf(episodes.filter(({ season_number }) => season_number !== 0)) : null, [inLibrary, episodes])

  // The diffusion of the header's pill and of the "All seasons" row (Seasons.tsx), computed once for both
  const diffusion = useMemo(() => {
    if (!show.data?.id || metadataLoading || !inLibrary || !episodes) {
      return null
    }

    return diffusionOf(show.data, { aired: progress.aired, next: nextAirDateOf(episodes) }, (global as any)?.config?.region || 'fr-FR')
  }, [show.data, metadataLoading, inLibrary, episodes, progress])

  // In the pills of the header: owned over aired, the size, then what waits on a gesture
  const summary = useMemo(() => {
    if (!diffusion) {
      return null
    }

    const size = sizeOf(episodes)
    const pending = proposals.rows.length
    const wanted = episodes.filter(episode => episodeStatus(episode) === 'wanted').length
    // To the first proposal shown, in its season's drawer or its episode's row (Seasons.tsx)
    const toProposals = (e) => {
      e.preventDefault()
      document.querySelector('[data-proposal]')?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }

    return [
      <span key='pills' sx={Show.styles.pills}>
        <ProgressPill {...progress} airing={diffusion.airing} followed={followed} detail={diffusion.detail} />
        {!!size && <ReleaseSize size={size} data-size={true} />}
        {!!pending && (
          <a href={`#seasons-${id}`} onClick={toProposals} title={`${pending} pending proposal${pending > 1 ? 's' : ''}`} sx={Show.styles.anchor}>
            <Badge emoji={EpisodeStatusOptions.proposed.emoji} label={pending} compact={true} size='small' />
          </a>
        )}
        {!!wanted && (
          <Badge emoji={EpisodeStatusOptions.wanted.emoji} label={wanted} compact={true} size='small' title={`${wanted} wanted episode${wanted > 1 ? 's' : ''}`} />
        )}
      </span>,
    ]
  }, [diffusion, progress, followed, episodes, proposals.rows.length, id])

  const additional = useMemo(() => ({
    externals: {
      ...(show.data?.external_ids?.imdb_id ? { imdb: `https://www.imdb.com/title/${show.data.external_ids.imdb_id}` } : {}),
    },
  }), [show.data?.external_ids?.imdb_id])

  const tabs = useMemo(() => {
    const recommendations = {
      id: `recommendations-${id}`,
      label: t('items.movies.recommendations.label'),
      entities: show.data?.recommendations?.results || [],
      child: ShowChild,
      extra: FOOTER_HEIGHT,
      ready,
    }

    const similar = {
      id: `similar-${id}`,
      label: t('items.movies.similar.label'),
      entities: show.data?.similar?.results || [],
      child: ShowChild,
      extra: FOOTER_HEIGHT,
      ready,
    }

    const cast = {
      id: `cast-${id}`,
      label: t('items.persons.cast.label'),
      entities: aggregateCredits(show.data?.aggregate_credits, Object.keys(persons), 'cast'),
      child: Person,
      ready,
    }

    const crew = {
      id: `crew-${id}`,
      label: t('items.persons.crew.label'),
      entities: aggregateCredits(show.data?.aggregate_credits, Object.keys(persons), 'crew'),
      child: Person,
      ready,
    }

    const related = ((!ready || (recommendations.entities.length || similar.entities.length)) && {
      id: 'related',
      ready,
      tabs: {
        ...((!ready || recommendations.entities.length) && { recommendations }),
        ...((!ready || similar.entities.length) && { similar }),
      },
    })

    const credits = ((!ready || (cast.entities.length || crew.entities.length)) && {
      id: 'credits',
      ready,
      tabs: {
        ...((!ready || cast.entities.length) && { cast }),
        ...((!ready || crew.entities.length) && { crew }),
      },
    })

    return [
      ...(related ? [related] : []),
      ...(credits ? [credits] : []),
    ]
  }, [ready, id, persons, show.data])

  if (show.error) {
    return (
      <Warning
        emoji='💢'
        title='Sorry, unable to display show...'
        subtitle={show.error.message}
      />
    )
  }

  // Until the metadata tells whether the show is in the library, and its episodes load if it is, the seasons are
  // unknown: out of the library, their drawers would fetch TMDB for nothing
  const seasonsReady = !metadataLoading && (!inLibrary || !!episodes)
  const actionsReady = ready && seasonsReady

  return (
    <Details
      details={show.details}
      entity={show.data}
      additional={additional}
      metadata={metadata}
      behavior='tv'
      state={state}
      setState={setState}
      summary={summary}
      tabs={tabs}
      loading={show.loading}
      ready={ready}
      search={openSearch}
      actions={inLibrary ? (
        <ShowActions
          entity={show.data}
          metadata={metadata}
          ready={actionsReady}
          setMetadata={setMetadata}
        />
      ) : null}
    >
      {episodesError ? (
        <Warning
          emoji='🚨'
          title='Sorry, unable to load the episodes...'
          subtitle={episodesError.message}
        />
      ) : (
        // The page's skeleton, in the palette Details starts from. Under it, a library row per season without an
        // episode: the block's height, no drawer to open
        <Skeleton palette={{ backgroundColor: theme.rawColors.grayLight }} ready={seasonsReady} placeholder={false}>
          <Seasons
            entity={show.data}
            episodes={(seasonsReady && inLibrary) ? episodes : []}
            proposals={proposals.rows}
            policy={proposals.policy}
            answer={proposals.answer}
            diffusion={diffusion}
            followed={followed}
            inLibrary={!seasonsReady || inLibrary}
            ready={actionsReady}
            followEpisodes={followEpisodes}
            search={openSearch}
          />
        </Skeleton>
      )}
      <Sensorr
        entity={show.data || {}}
        loading={!actionsReady}
        metadata={searched}
        unit={search.unit}
        title={search.title}
        proposal={search.proposal}
        describe={describeRelease}
        onPick={pickRelease}
        banned={searched.banned_releases}
        onBan={inLibrary ? toggleBan : false}
        setPortalToggle={(toggleOpen) => toggleSearch.current = (e) => toggleOpen(e)}
      />
    </Details>
  )
}

Show.styles = {
  // The pills of the "All seasons" row (Seasons.tsx), at the size of its release tags
  pills: {
    display: 'inline-flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    '>[data-size]': {
      fontSize: 6,
      whiteSpace: 'nowrap',
    },
  },
  anchor: {
    display: 'flex',
    color: 'inherit',
    textDecoration: 'none',
    borderRadius: '2em',
    '>span': {
      transition: 'background-color 200ms ease-in-out',
    },
    ':hover >span': {
      backgroundColor: 'grayDark',
    },
    ':focus-visible': {
      outline: '1px solid',
      outlineColor: 'grayDarkest',
      outlineOffset: '2px',
    },
  },
}

export default withBody({ overlayScrollbars: true })(Show)
