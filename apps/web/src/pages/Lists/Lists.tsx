import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import { Entities, Warning } from '@sensorr/ui'
import { emojize, useTitle } from '@sensorr/utils'
import Body from '../../layout/Body/Body'
import { useConfigContext } from '../../contexts/Config/Config'
import { useAPI } from '../../store/api'
import { useTMDB } from '../../store/tmdb'
import { MovieWithCreditsAndReviews } from '../../components/Movie/Movie'
import Show, { FOOTER_HEIGHT } from '../../components/Show/Show'
import { List, compareOf, listsOf } from '../Home/rows'
import { ListRow, fetchSource } from '../Home/Items/List'
import withBulk from '../../components/enhancers/withBulk'

const EntitiesWithBulk = withBulk()(Entities)

// TMDB answers 500 pages of a discover query at most
const PAGES = 500

// The entities a step of the grid adds at most
const STEP = 40

// The whole list, page after page: each source in turn, or, sorted, the best head of them all at each step since
// each source answers sorted on the same field. An entity is shown once.
const useListAll = (list: List) => {
  const api = useAPI()
  const tmdb = useTMDB()
  const [entities, setEntities] = useState([])
  const [length, setLength] = useState(null)
  const [error, setError] = useState(null)
  const fresh = () => ({ controller: new AbortController(), buffers: (list?.sources || []).map(() => []), pages: (list?.sources || []).map(() => 1), done: (list?.sources || []).map(() => false), totals: [], seen: new Set(), loading: false })
  const cursor = useRef(fresh())

  const next = useCallback(async () => {
    const current = cursor.current

    if (!list || current.loading) {
      return
    }

    current.loading = true
    const open = (i: number) => !current.done[i] || current.buffers[i].length
    // Unsorted, only the first source not used up takes part
    const playing = () => list.sources.map((_, i) => i).filter(open).slice(0, list.sort ? undefined : 1)
    const compare = list.sort ? compareOf(list) : null
    const out = []

    try {
      while (out.length < STEP && playing().length) {
        const empty = playing().filter((i) => !current.buffers[i].length)

        if (empty.length) {
          await Promise.all(empty.map(async (i) => {
            const page = await fetchSource(api, tmdb, list, list.sources[i], current.pages[i], { signal: current.controller.signal })
            current.buffers[i].push(...page.results)
            current.totals[i] = Math.min(page.total_results, PAGES * 20)
            current.done[i] = current.pages[i] >= Math.min(page.total_pages, PAGES)
            current.pages[i] += 1
          }))

          if (cursor.current !== current) {
            return
          }

          continue
        }

        const [best] = playing().sort((a, b) => compare ? compare(current.buffers[a][0], current.buffers[b][0]) : 0)
        const entity = current.buffers[best].shift()

        if (!current.seen.has(entity.id)) {
          current.seen.add(entity.id)
          out.push(entity)
        }
      }

      setEntities((entities) => [...entities, ...out])
      // Until every source is used up, the grid holds room for what they announce
      setLength(playing().length ? current.totals.reduce((sum, total) => sum + (total || 0), 0) : null)
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.warn(e)
        setError(e)
      }
    } finally {
      current.loading = false
    }
  }, [api, tmdb, list])

  useEffect(() => {
    cursor.current = fresh()
    setEntities([])
    setLength(null)
    setError(null)
    next()

    // A grid left, or another list, stops what the previous one still fetches
    const { controller } = cursor.current
    return () => controller.abort()
  }, [JSON.stringify(list)])

  const onMore = useCallback((visible) => {
    if (Math.max(0, ...visible.map(({ index }) => index)) >= entities.length - 20) {
      next()
    }
  }, [entities.length, next])

  return { entities, length: length ?? entities.length, onMore, error, ready: !!entities.length || !cursor.current.done.some((done) => !done) }
}

// One list of the config, whole, as a grid
export const ListPage = ({ media }: { media: 'movie' | 'tv' }) => {
  const { id } = useParams()
  const { config } = useConfigContext()
  const list = listsOf(config).find((list) => list.id === id && list.media === media)
  const { entities, length, onMore, error, ready } = useListAll(list)
  const { t } = useTranslation()
  useTitle(list?.name || t('pages.lists.list'))

  if (!list) {
    return (
      <Body>
        <Warning emoji='🗂️' title={t('pages.lists.missing.title')} subtitle={<span><Trans t={t} i18nKey='pages.lists.missing.subtitle' components={[<Link to='/settings/lists' />]} /></span>} />
      </Body>
    )
  }

  return (
    <Body>
      <EntitiesWithBulk
        id={`list_page_${list.id}`}
        bulk={media}
        label={emojize('🗂️', list.name)}
        display='grid'
        child={media === 'movie' ? MovieWithCreditsAndReviews : Show}
        extra={media === 'tv' ? FOOTER_HEIGHT : 0}
        entities={entities}
        length={length}
        onMore={onMore as any}
        ready={ready}
        error={error}
        empty={{ emoji: '🗂️', title: t('pages.lists.empty.title'), subtitle: <span><Trans t={t} i18nKey='pages.lists.empty.subtitle' values={{ media }} components={[<Link to={`/${media}/library`} />, <Link to='/settings/lists' />]} /></span> }}
      />
    </Body>
  )
}

// Every list of a media, as the rows a Home would show
export const ListsPage = ({ media }: { media: 'movie' | 'tv' }) => {
  const { config } = useConfigContext()
  const lists = listsOf(config).filter((list) => list.media === media)
  const { t } = useTranslation()
  useTitle(t('header.pages.lists'))

  return (
    // Without the scrollbars the empty state takes the height of the page, centered in it
    <Body overlayScrollbars={!!lists.length}>
      {lists.length ? lists.map((list) => <ListRow key={list.id} list={list} hide={false} />) : (
        <Warning
          emoji='🗂️'
          title={t('pages.lists.none.title', { media })}
          subtitle={<span><Trans t={t} i18nKey='pages.lists.none.subtitle' components={[<Link to={`/${media}/discover`} />, <Link to={`/${media}/library`} />, <Link to='/settings/lists' />]} /></span>}
        />
      )}
    </Body>
  )
}
