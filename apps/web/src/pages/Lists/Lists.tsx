import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Entities, Warning } from '@sensorr/ui'
import { emojize, useTitle } from '@sensorr/utils'
import Body from '../../layout/Body/Body'
import { useConfigContext } from '../../contexts/Config/Config'
import { useAPI } from '../../store/api'
import { useTMDB } from '../../store/tmdb'
import { MovieWithCreditsAndReviews } from '../../components/Movie/Movie'
import Show, { FOOTER_HEIGHT } from '../../components/Show/Show'
import { List, listsOf } from '../Home/rows'
import { ListRow, fetchSource } from '../Home/Items/List'

const NOUNS = { movie: 'movies', tv: 'shows' }

// TMDB answers 500 pages of a discover query at most
const PAGES = 500

// The whole list, page after page of each source in turn, an entity shown once
const useListAll = (list: List) => {
  const api = useAPI()
  const tmdb = useTMDB()
  const [entities, setEntities] = useState([])
  const [length, setLength] = useState(null)
  const [error, setError] = useState(null)
  const cursor = useRef({ source: 0, page: 1, totals: [], seen: new Set(), loading: false })

  const next = useCallback(async () => {
    const current = cursor.current

    if (!list || current.loading || current.source >= list.sources.length) {
      return
    }

    current.loading = true

    try {
      const page = await fetchSource(api, tmdb, list, list.sources[current.source], current.page, { signal: undefined })

      if (cursor.current !== current) {
        return
      }

      current.totals[current.source] = page.total_results
      const fresh = page.results.filter(({ id }) => !current.seen.has(id) && current.seen.add(id))
      const last = current.page >= Math.min(page.total_pages, PAGES)
      Object.assign(current, last ? { source: current.source + 1, page: 1 } : { page: current.page + 1 })

      setEntities((entities) => [...entities, ...fresh])
      // Until every source answered, the grid holds room for what they announce
      setLength((length) => current.source >= list.sources.length
        ? null
        : current.totals.reduce((sum, total) => sum + Math.min(total, PAGES * 20), 0))
    } catch (e) {
      console.warn(e)
      setError(e)
    } finally {
      current.loading = false
    }
  }, [api, tmdb, list])

  useEffect(() => {
    cursor.current = { source: 0, page: 1, totals: [], seen: new Set(), loading: false }
    setEntities([])
    setLength(null)
    setError(null)
    next()
  }, [JSON.stringify(list)])

  const onMore = useCallback((visible) => {
    if (Math.max(0, ...visible.map(({ index }) => index)) >= entities.length - 20) {
      next()
    }
  }, [entities.length, next])

  return { entities, length: length ?? entities.length, onMore, error, ready: !!entities.length || cursor.current.source >= (list?.sources.length || 0) }
}

// One list of the config, whole, as a grid
export const ListPage = ({ media }: { media: 'movie' | 'tv' }) => {
  const { id } = useParams()
  const { config } = useConfigContext()
  const list = listsOf(config).find((list) => list.id === id && list.media === media)
  const { entities, length, onMore, error, ready } = useListAll(list)
  useTitle(list?.name || 'List')

  if (!list) {
    return (
      <Body>
        <Warning emoji='🗂️' title='No such list' subtitle={<Link to='/settings/lists'>See the lists in Settings</Link>} />
      </Body>
    )
  }

  return (
    <Body>
      <Entities
        id={`list_page_${list.id}`}
        label={emojize('🗂️', list.name)}
        display='grid'
        child={media === 'movie' ? MovieWithCreditsAndReviews : Show}
        extra={media === 'tv' ? FOOTER_HEIGHT : 0}
        entities={entities}
        length={length}
        onMore={onMore as any}
        ready={ready}
        error={error}
        empty={{ emoji: '🗂️', title: 'Nothing in it yet', subtitle: <Link to='/settings/lists'>Edit the list in Settings</Link> }}
      />
    </Body>
  )
}

// Every list of a media, as the rows a Home would show
export const ListsPage = ({ media }: { media: 'movie' | 'tv' }) => {
  const { config } = useConfigContext()
  const lists = listsOf(config).filter((list) => list.media === media)
  useTitle('Lists')

  return (
    <Body overlayScrollbars={true}>
      {lists.length ? lists.map((list) => <ListRow key={list.id} list={list} hide={false} />) : (
        <Warning emoji='🗂️' title={`No list of ${NOUNS[media]} yet`} subtitle={<Link to='/settings/lists'>Make one in Settings</Link>} />
      )}
    </Body>
  )
}
