import { useEffect, useRef, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import { nanoid } from 'nanoid'
import { Button, Controls, Entities, Sorting, serializeControls, valuesOfControls } from '@sensorr/ui'
import i18n from '@sensorr/i18n'
import { emojize, useTitle } from '@sensorr/utils'
import Body from '../../layout/Body/Body'
import { useConfigContext } from '../../contexts/Config/Config'
import { useAPI } from '../../store/api'
import { useTMDB } from '../../store/tmdb'
import { MovieWithCreditsAndReviews } from '../../components/Movie/Movie'
import Show, { FOOTER_HEIGHT } from '../../components/Show/Show'
import { CONTROLS as DISCOVER_MOVIES } from '../Discover/Discover'
import { CONTROLS as DISCOVER_SHOWS } from '../Shows/Discover'
import { CONTROLS as LIBRARY_MOVIES } from '../Library/Library'
import { CONTROLS as LIBRARY_SHOWS } from '../Shows/Library'
import { List, Row, listRowId, listsOf, pruned } from '../Home/rows'
import { fetchSource, summaryOf, useListPages } from '../Home/Items/List'

const MEDIA = { movie: '🍿', tv: '📺' }
const KINDS = { discover: '🌍', library: '📚', custom: '✍️' }
const SOURCES = ['discover', 'library', 'custom'] as const
// The sorts a whole list takes, its sources merged; none keeps them one after the other
const sortings = (media: 'movie' | 'tv') => [
  { value: 'none', label: emojize('🗂️', i18n.t('settings.lists.sortings.none')) },
  { value: 'popularity', label: i18n.t('ui.sortings.popularity') },
  { value: 'release_date', label: i18n.t(media === 'movie' ? 'ui.sortings.primary_release_date' : 'ui.sortings.first_air_date') },
  { value: 'vote_average', label: i18n.t('ui.sortings.vote_average') },
  { value: 'vote_count', label: i18n.t('ui.sortings.vote_count') },
]

const CONTROLS = {
  discover: { movie: DISCOVER_MOVIES, tv: DISCOVER_SHOWS },
  library: { movie: LIBRARY_MOVIES, tv: LIBRARY_SHOWS },
}

const Lists = ({ ...props }) => {
  const { t } = useTranslation()
  useTitle(t('settings.documentTitle', { page: t('settings.sections.lists') }))
  const { onSave } = useOutletContext() as any
  const { config } = useConfigContext()
  const api = useAPI()
  const tmdb = useTMDB()
  const [lists, setLists] = useState<List[]>(() => listsOf(config))
  const [name, setName] = useState('')
  const [media, setMedia] = useState<'movie' | 'tv'>('movie')

  const saved = listsOf(config)
  const dirty = JSON.stringify(lists) !== JSON.stringify(saved)
  // A filter saved as bare ids, the genres or the lists of Library, reads by name
  const names = { ...tmdb.genres, ...tmdb.tvGenres, ...Object.fromEntries(lists.map((list) => [list.id, list])) }
  const setList = (id: string, change: (list: List) => List) => setLists((lists) => lists.map((list) => list.id === id ? change(list) : list))
  const policies = (config.get('policies') || []).map(({ name }) => name)

  // A list given another policy hands it to the titles added to it by hand: said with their count before it does
  const confirmPolicies = async () => {
    const given = lists.filter((list) => list.policy && list.policy !== saved.find(({ id }) => id === list.id)?.policy && list.sources.some(({ kind }) => kind === 'custom'))
    const counts = await Promise.all(given.map((list) => fetchSource(api, tmdb, list, { kind: 'custom' }, 1, { signal: undefined }).then(({ total_results }) => total_results, () => null)))
    const lines = given.map((list, index) => t(counts[index] == null ? 'settings.lists.confirm.unknown' : 'settings.lists.confirm.line', { name: list.name, policy: list.policy, count: counts[index], media: list.media }))
    return !lines.length || window.confirm(`${lines.join('\n')}\n\n${t('settings.lists.confirm.save')}`)
  }

  return (
    <Body>
      <section>
        <article>
          <h2>{t('settings.sections.lists')}</h2>
          <p>
            <Trans t={t} i18nKey='settings.lists.intro' components={[<Link to='/settings/home' />, <Link to='/movie/discover' />, <Link to='/movie/library' />]} />
          </p>
          <form
            sx={Lists.styles.create}
            onSubmit={(e) => {
              e.preventDefault()
              setLists((lists) => [...lists, { id: nanoid(8), name: name.trim(), media, sources: [{ kind: 'custom' }] }])
              setName('')
            }}
          >
            <input type='text' value={name} onChange={(e) => setName(e.target.value)} placeholder={t('settings.lists.create.name')} aria-label={t('settings.lists.create.name')} required={true} sx={{ variant: 'input.default', flex: 1, minWidth: 0 }} />
            <select value={media} onChange={(e) => setMedia(e.target.value as 'movie' | 'tv')} aria-label={t('settings.lists.create.media')} sx={{ variant: 'select.default', width: 'auto', flex: '0 0 auto' }}>
              <option value='movie'>{emojize(MEDIA.movie, t('settings.lists.media.movie'))}</option>
              <option value='tv'>{emojize(MEDIA.tv, t('settings.lists.media.tv'))}</option>
            </select>
            <button type='submit' title={t('settings.lists.create.submit')} disabled={!name.trim()} sx={Lists.styles.plus}>+</button>
          </form>
          <form
            sx={{ display: 'flex', flexDirection: 'column' }}
            onSubmit={async (e) => {
              e.preventDefault()

              if (!await confirmPolicies()) {
                return
              }

              const ids = lists.map(listRowId)
              // A deleted list leaves every Home with it
              const home = Object.fromEntries(Object.entries(config.get('home')).map(([key, rows]: [string, Row[]]) => [key, pruned(rows, ids)]))
              // The config reloads in place: a new state redraws Save as saved
              onSave({ lists, home }).then(() => setLists((lists) => [...lists]), () => null)
            }}
          >
            {!lists.length ? (
              <p sx={Lists.styles.empty}>
                <Trans t={t} i18nKey='settings.lists.empty' components={[<Link to='/movie/discover' />, <Link to='/movie/library' />]} />
              </p>
            ) : lists.map((list) => (
              <ListSettings
                key={list.id}
                list={list}
                names={names}
                policies={policies}
                saved={saved.some(({ id }) => id === list.id)}
                onChange={(change) => setList(list.id, change)}
                onDelete={() => window.confirm(t('settings.lists.delete.confirm', { name: list.name })) && setLists((lists) => lists.filter(({ id }) => id !== list.id))}
              />
            ))}
            <div sx={{ display: 'flex', marginTop: 4 }}>
              <Button type='submit' color='primary' disabled={!dirty} title={dirty ? undefined : t('settings.save.nothing')} sx={{ flex: 1 }}>{t('settings.save.label')}</Button>
            </div>
          </form>
        </article>
      </section>
    </Body>
  )
}

const ListSettings = ({ list, names, policies, saved, onChange, onDelete }) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(true)
  const custom = list.sources.some(({ kind }) => kind === 'custom')

  return (
    <div sx={Lists.styles.list} role='group' aria-label={list.name}>
      <div>
        <button type='button' aria-expanded={open} title={open ? t('settings.lists.fold') : t('settings.lists.unfold')} onClick={() => setOpen((open) => !open)} sx={Lists.styles.fold}>
          {open ? '▾' : '▸'}
        </button>
        <input
          type='text'
          value={list.name}
          onChange={(e) => onChange((list) => ({ ...list, name: e.target.value }))}
          aria-label={t('settings.lists.name')}
          required={true}
        />
        <label sx={Lists.styles.policy} title={custom ? t('settings.lists.policy.title', { media: list.media }) : t('settings.lists.policy.disabled')}>
          <span>{t('settings.lists.policy.label')}</span>
          <select
            value={list.policy || ''}
            onChange={(e) => onChange((list) => ({ ...list, policy: e.target.value || null }))}
            disabled={!custom}
          >
            <option value=''>{t('settings.lists.policy.none')}</option>
            {policies.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
        <span sx={Lists.styles.sort}>
          <Sorting
            options={sortings(list.media)}
            value={list.sort ? { value: list.sort.by, sort: list.sort.descending } : { value: 'none', sort: true }}
            onChange={({ value, sort }) => onChange((list) => ({ ...list, sort: value === 'none' ? null : { by: value, descending: sort } }))}
          />
        </span>
        <button type='button' title={t('settings.lists.delete.title')} onClick={onDelete}>✕</button>
      </div>
      {open && <ListBody list={list} names={names} saved={saved} onChange={onChange} />}
    </div>
  )
}

// What fills a list and a sample of it, loaded only while the list is unfolded
const ListBody = ({ list, names, saved, onChange }) => {
  const { t } = useTranslation()
  const { entities, totals, error } = useListPages(list)
  // The source just added opens its filters panel at once
  const [added, setAdded] = useState(null)

  return (
    <>
      {/* `article` indents every list of Settings */}
      <ul style={{ paddingLeft: 0 }}>
        {list.sources.map((source, index) => (
          // A source changes its hooks with its kind: its key changes with it
          <li key={`${source.kind}-${index}`}>
            <strong>{emojize(KINDS[source.kind], t(`settings.lists.kinds.${source.kind}`))}</strong>
            {source.kind === 'custom' ? (
              <span>{typeof totals[index] === 'number' ? t('settings.lists.count', { count: totals[index], media: list.media }) : '…'}</span>
            ) : (
              <SourceFilters
                list={list}
                source={source}
                open={added === index}
                onOpened={() => setAdded(null)}
                summary={summaryOf(list, source, names).join(' · ') || t('settings.lists.everyOne')}
                onChange={(values) => onChange((list) => ({ ...list, sources: list.sources.map((other, i) => i === index ? { ...other, values } : other) }))}
              />
            )}
            <button
              type='button'
              sx={Lists.styles.remove}
              title={list.sources.length === 1 ? t('settings.lists.remove.last') : t('settings.lists.remove.title')}
              disabled={list.sources.length === 1}
              onClick={() => onChange((list) => ({ ...list, sources: list.sources.filter((_, other) => other !== index) }))}
            >
              ✕
            </button>
          </li>
        ))}
        <li sx={Lists.styles.add}>
          <span>{t('settings.lists.add.label')}</span>
          {SOURCES.map((kind) => (
            <button
              key={kind}
              type='button'
              disabled={kind === 'custom' && list.sources.some((source) => source.kind === 'custom')}
              title={kind === 'custom' ? t('settings.lists.add.custom', { media: list.media }) : t(`settings.lists.add.${kind}`)}
              onClick={() => {
                setAdded(kind === 'custom' ? null : list.sources.length)
                onChange((list) => ({ ...list, sources: [...list.sources, kind === 'custom' ? { kind } : { kind, values: {} }] }))
              }}
            >
              {emojize(KINDS[kind], t(`settings.lists.kinds.${kind}`))}
            </button>
          ))}
        </li>
      </ul>
      <div sx={Lists.styles.row}>
        <Entities
          id={`list_settings_${list.id}`}
          display='row'
          child={list.media === 'movie' ? MovieWithCreditsAndReviews : Show}
          extra={list.media === 'tv' ? FOOTER_HEIGHT : 0}
          limit={20}
          entities={entities || []}
          length={entities?.length}
          ready={!!entities}
          error={error}
          empty={{ emoji: '🗂️', title: t('settings.lists.nothing.title'), subtitle: list.sources.some(({ kind }) => kind === 'custom') ? t('settings.lists.nothing.custom', { media: list.media }) : t('settings.lists.nothing.filters') }}
        />
      </div>
      {saved && <Link to={`/${list.media}/lists/${list.id}`} sx={Lists.styles.see}>{t('settings.lists.see')}</Link>}
    </>
  )
}

// The statistics of Discover recompute on each new array of entities: a source has none, always the same
const NONE = []

// The filters of a source as a button that opens their panel; a source just added opens it at once
const SourceSummary = ({ toggleOpen, summary, open, onOpened }) => {
  const { t } = useTranslation()
  const button = useRef(null)
  // Once: a second run, as StrictMode does, would close it again
  const opened = useRef(false)

  // The portal of the panel opens on an event of the element it hangs from: this button
  useEffect(() => {
    if (open && !opened.current) {
      opened.current = true
      toggleOpen({ currentTarget: button.current, target: button.current, stopPropagation: () => null })
      onOpened()
    }
  }, [])

  return <button ref={button} type='button' title={t('settings.lists.edit')} onClick={toggleOpen} sx={Lists.styles.summary}>{summary}</button>
}

// The filters of a source as their panel titles them: a click opens the panel on them
const SourceFilters = ({ list, source, summary, open = false, onOpened = null, onChange }) => {
  const controls = CONTROLS[source.kind][list.media]
  const values: { [key: string]: any } = valuesOfControls(controls.fields, source.values)
  const statistics = controls.useStatistics(NONE, controls.fields, serializeControls(controls.fields, values))

  return (
    <Controls
      title=''
      fields={controls.fields}
      values={values}
      onChange={onChange}
      layout={{ aside: controls.layout.aside }}
      components={{ ...controls.components, toggle: SourceSummary }}
      props={{ summary, open, onOpened }}
      statistics={statistics}
      loading={false}
      total={0}
    />
  )
}

Lists.styles = {
  create: {
    display: 'flex',
    alignItems: 'stretch',
    marginTop: 4,
    '>input, >select': {
      borderTopRightRadius: '0rem',
      borderBottomRightRadius: '0rem',
    },
    '>select': {
      borderTopLeftRadius: '0rem',
      borderBottomLeftRadius: '0rem',
      marginLeft: '-1px',
    },
  },
  plus: {
    variant: 'button.reset',
    paddingX: 6,
    backgroundColor: 'accent',
    color: 'whitePure',
    borderTopRightRadius: '0.25rem',
    borderBottomRightRadius: '0.25rem',
    '&:hover:not(:disabled)': {
      backgroundColor: 'accentDarker',
    },
    '&:active:not(:disabled)': {
      backgroundColor: 'accentDarkest',
    },
    '&:disabled': {
      opacity: 0.45,
      cursor: 'default',
    },
  },
  empty: {
    marginY: 4,
    color: 'grayDarkest',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    overflow: 'hidden',
    marginTop: 2,
    paddingTop: 6,
    borderTop: '1px solid',
    borderColor: 'grayDark',
    '>div:first-of-type': {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      '>input': {
        variant: 'input.reset',
        flex: 1,
        minWidth: 0,
        paddingY: 10,
        fontFamily: 'heading',
        fontWeight: 'bold',
        fontSize: 3,
        borderBottom: '1px solid transparent',
        textOverflow: 'ellipsis',
        ':hover': {
          borderColor: 'grayDark',
        },
        ':focus-visible': {
          outline: 'none',
          borderColor: 'primary',
        },
      },
      '>button:last-of-type': {
        variant: 'button.reset',
        paddingX: 8,
        color: 'error',
        ':hover': {
          color: 'errorDarker',
        },
      },
    },
    '>ul': {
      listStyle: 'none',
      marginY: 8,
      '>li': {
        display: 'flex',
        alignItems: 'baseline',
        gap: 6,
        paddingY: 10,
        fontSize: 5,
        '>strong': {
          fontWeight: 'semibold',
          whiteSpace: 'nowrap',
        },
        '>span': {
          flex: 1,
          color: 'grayDarkest',
        },
      },
    },
  },
  add: {
    alignItems: 'center',
    '&& >span': {
      flex: '0 0 auto',
      color: 'grayDarkest',
    },
    '>button': {
      variant: 'button.reset',
      paddingX: 8,
      paddingY: 10,
      border: '1px dashed',
      borderColor: 'grayDark',
      borderRadius: '0.25rem',
      color: 'grayDarkest',
      ':hover:not(:disabled), :focus-visible': {
        color: 'text',
        borderColor: 'grayDarker',
      },
      ':disabled': {
        opacity: 0.45,
        cursor: 'default',
      },
    },
  },
  remove: {
    variant: 'button.reset',
    paddingX: 8,
    color: 'error',
    '&:disabled': {
      opacity: 0.3,
      cursor: 'default',
    },
  },
  summary: {
    variant: 'button.reset',
    flex: 1,
    minWidth: 0,
    textAlign: 'left',
    color: 'grayDarkest',
    textDecoration: 'underline',
    textDecorationStyle: 'dotted',
    textUnderlineOffset: '0.25em',
    cursor: 'pointer',
    ':hover, :focus-visible': {
      color: 'text',
    },
  },
  fold: {
    variant: 'button.reset',
    width: '1.5em',
    fontFamily: 'monospace',
    color: 'grayDarkest',
    ':hover, :focus-visible': {
      color: 'text',
    },
  },
  // Read as the Sorting next to it: the label quiet, the policy in the text color
  policy: {
    flex: '0 0 auto',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 6,
    color: 'grayDarkest',
    '>select': {
      variant: 'select.reset',
      maxWidth: '12em',
      color: 'text',
      fontWeight: 'semibold',
      cursor: 'pointer',
      ':hover:not(:disabled), :focus-visible': {
        textDecoration: 'underline',
        textUnderlineOffset: '0.25em',
      },
      ':disabled': {
        opacity: 0.45,
        cursor: 'default',
      },
    },
  },
  // The Sorting of the green bars of Discover and Library, without the green it hovers with there
  sort: {
    flex: '0 0 auto',
    fontSize: 6,
    color: 'grayDarkest',
    '>div:hover, >div >button:hover, >div >div:hover': {
      backgroundColor: 'transparent',
      color: 'text',
    },
  },
  // The posters of the mobile, a sample of the list rather than the list
  row: {
    fontSize: ['1em', '0.6em'],
    // `article` colors every link, a poster title included
    '&& a': {
      color: 'inherit',
    },
  },
  see: {
    alignSelf: 'flex-start',
    marginBottom: 6,
    fontSize: 6,
    // Over the green `article` gives every link
    '&&': {
      color: 'grayDarkest',
      textDecoration: 'none',
    },
    '&&:hover, &&:focus-visible': {
      color: 'text',
    },
  },
}

export default Lists
