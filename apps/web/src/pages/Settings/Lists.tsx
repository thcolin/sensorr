import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { Button, Controls, Entities, serializeControls, valuesOfControls } from '@sensorr/ui'
import { emojize, useTitle } from '@sensorr/utils'
import Body from '../../layout/Body/Body'
import { useConfigContext } from '../../contexts/Config/Config'
import { useTMDB } from '../../store/tmdb'
import { MovieWithCreditsAndReviews } from '../../components/Movie/Movie'
import Show, { FOOTER_HEIGHT } from '../../components/Show/Show'
import { CONTROLS as DISCOVER_MOVIES } from '../Discover/Discover'
import { CONTROLS as DISCOVER_SHOWS } from '../Shows/Discover'
import { CONTROLS as LIBRARY_MOVIES } from '../Library/Library'
import { CONTROLS as LIBRARY_SHOWS } from '../Shows/Library'
import { List, listRowId, listsOf } from '../Home/rows'
import { summaryOf, useListPages } from '../Home/Items/List'

const MEDIA = { movie: emojize('🍿', 'Movies'), tv: emojize('📺', 'TV') }
const NOUNS = { movie: 'movies', tv: 'shows' }
const KINDS = { discover: emojize('🌍', 'TMDB'), library: emojize('📚', 'Library'), custom: emojize('✍️', 'Custom') }
const CONTROLS = {
  discover: { movie: DISCOVER_MOVIES, tv: DISCOVER_SHOWS },
  library: { movie: LIBRARY_MOVIES, tv: LIBRARY_SHOWS },
}

const Lists = ({ ...props }) => {
  useTitle('Settings - Lists')
  const { onSave } = useOutletContext() as any
  const { config } = useConfigContext()
  const tmdb = useTMDB()
  const [lists, setLists] = useState<List[]>(() => listsOf(config))
  const [name, setName] = useState('')
  const [media, setMedia] = useState<'movie' | 'tv'>('movie')

  const saved = listsOf(config)
  const dirty = JSON.stringify(lists) !== JSON.stringify(saved)
  // A filter saved as bare ids, the genres or the lists of Library, reads by name
  const names = { ...tmdb.genres, ...tmdb.tvGenres, ...Object.fromEntries(lists.map((list) => [list.id, list])) }
  const setList = (id: string, change: (list: List) => List) => setLists((lists) => lists.map((list) => list.id === id ? change(list) : list))

  return (
    <Body>
      <section>
        <article>
          <h2>Lists</h2>
          <p>
            A list is a row you can show on a Home, from <Link to='/settings/home'>Home</Link>. It follows the filters you saved from <Link to='/movie/discover'>Discover</Link> or <Link to='/movie/library'>Library</Link>, the movies and shows you add to it from their page or from Library, or both, one after the other.
          </p>
          <form
            sx={Lists.styles.create}
            onSubmit={(e) => {
              e.preventDefault()
              setLists((lists) => [...lists, { id: nanoid(8), name: name.trim(), media, sources: [{ kind: 'custom' }] }])
              setName('')
            }}
          >
            <input type='text' value={name} onChange={(e) => setName(e.target.value)} placeholder='Name of a new custom list' aria-label='Name of a new custom list' required={true} sx={{ variant: 'input.default', flex: 1, minWidth: 0 }} />
            <select value={media} onChange={(e) => setMedia(e.target.value as 'movie' | 'tv')} aria-label='Movies or shows' sx={{ variant: 'select.default', width: 'auto', flex: '0 0 auto' }}>
              <option value='movie'>{MEDIA.movie}</option>
              <option value='tv'>{MEDIA.tv}</option>
            </select>
            <button type='submit' title='Create the list' disabled={!name.trim()} sx={Lists.styles.plus}>+</button>
          </form>
          <form
            sx={{ display: 'flex', flexDirection: 'column' }}
            onSubmit={(e) => {
              e.preventDefault()
              const ids = lists.map(listRowId)
              // A deleted list leaves every Home with it
              const home = Object.fromEntries(Object.entries(config.get('home')).map(([key, rows]: [string, any[]]) => [key, rows.filter(({ id }) => !id.startsWith('list:') || ids.includes(id))]))
              // The config reloads in place: a new state redraws Save as saved
              onSave({ lists, home }).then(() => setLists((lists) => [...lists]), () => null)
            }}
          >
            {!lists.length ? (
              <p sx={Lists.styles.empty}>
                No list yet. Save the filters of <Link to='/movie/discover'>Discover</Link> or <Link to='/movie/library'>Library</Link> as a list, or name a custom list above.
              </p>
            ) : lists.map((list) => (
              <ListSettings
                key={list.id}
                list={list}
                names={names}
                saved={saved.some(({ id }) => id === list.id)}
                onChange={(change) => setList(list.id, change)}
                onDelete={() => window.confirm(`Delete "${list.name}"? It leaves every Home once you Save.`) && setLists((lists) => lists.filter(({ id }) => id !== list.id))}
              />
            ))}
            <div sx={{ display: 'flex', marginTop: 4 }}>
              <Button type='submit' color='primary' disabled={!dirty} title={dirty ? undefined : 'Nothing to save'} sx={{ flex: 1 }}>Save</Button>
            </div>
          </form>
        </article>
      </section>
    </Body>
  )
}

const ListSettings = ({ list, names, saved, onChange, onDelete }) => {
  const { entities, totals, error } = useListPages(list)
  // The source just added opens its filters panel at once
  const [added, setAdded] = useState(null)

  return (
    <div sx={Lists.styles.list} role='group' aria-label={list.name}>
      <div>
        <input
          type='text'
          value={list.name}
          onChange={(e) => onChange((list) => ({ ...list, name: e.target.value }))}
          aria-label='Name of the list'
          required={true}
        />
        <button type='button' title='Delete the list' onClick={onDelete}>✕</button>
      </div>
      {/* `article` indents every list of Settings */}
      <ul style={{ paddingLeft: 0 }}>
        {list.sources.map((source, index) => (
          <li key={index}>
            <strong>{KINDS[source.kind]}</strong>
            {source.kind === 'custom' ? (
              <span>{typeof totals[index] === 'number' ? `${totals[index]} ${NOUNS[list.media]}` : '…'}</span>
            ) : (
              <SourceFilters
                list={list}
                source={source}
                open={added === index}
                onOpened={() => setAdded(null)}
                summary={summaryOf(list, source, names).join(' · ') || 'Every one'}
                onChange={(values) => onChange((list) => ({ ...list, sources: list.sources.map((other, i) => i === index ? { ...other, values } : other) }))}
              />
            )}
            <button
              type='button'
              sx={Lists.styles.remove}
              title={list.sources.length === 1 ? 'A list keeps one source at least' : 'Remove from the list'}
              disabled={list.sources.length === 1}
              onClick={() => onChange((list) => ({ ...list, sources: list.sources.filter((_, other) => other !== index) }))}
            >
              ✕
            </button>
          </li>
        ))}
        <li sx={Lists.styles.add}>
          <span>Add</span>
          {(['discover', 'library', 'custom'] as const).map((kind) => (
            <button
              key={kind}
              type='button'
              disabled={kind === 'custom' && list.sources.some((source) => source.kind === 'custom')}
              title={kind === 'custom' ? `The ${NOUNS[list.media]} you add from their page or from Library` : `Filters of ${kind === 'discover' ? 'Discover' : 'Library'}`}
              onClick={() => {
                setAdded(kind === 'custom' ? null : list.sources.length)
                onChange((list) => ({ ...list, sources: [...list.sources, kind === 'custom' ? { kind } : { kind, values: {} }] }))
              }}
            >
              {KINDS[kind]}
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
          empty={{ emoji: '🗂️', title: 'Nothing in it yet', subtitle: list.sources.some(({ kind }) => kind === 'custom') ? `Add ${NOUNS[list.media]} from their page or from Library` : 'Its filters match nothing' }}
        />
      </div>
      {saved && <Link to={`/${list.media}/lists/${list.id}`} sx={Lists.styles.see}>See the whole list ›</Link>}
    </div>
  )
}

// The statistics of Discover recompute on each new array of entities: a source has none, always the same
const NONE = []

// The filters of a source as their panel titles them: a click opens the panel on them
const SourceFilters = ({ list, source, summary, open = false, onOpened = null, onChange }) => {
  const controls = CONTROLS[source.kind][list.media]
  const values = valuesOfControls(controls.fields, source.values)
  const statistics = controls.useStatistics(NONE, controls.fields, serializeControls(controls.fields, values))
  const Summary = useCallback(({ toggleOpen }) => {
    // Once: a second run, as StrictMode does, would close it again
    const opened = useRef(false)

    useEffect(() => {
      if (open && !opened.current) {
        opened.current = true
        toggleOpen()
        onOpened()
      }
    }, [])

    return <button type='button' title='Edit the filters' onClick={toggleOpen} sx={Lists.styles.summary}>{summary}</button>
  }, [summary])

  return (
    <Controls
      title=''
      fields={controls.fields}
      values={values}
      onChange={onChange}
      layout={{ aside: controls.layout.aside }}
      components={{ ...controls.components, toggle: Summary }}
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
      '>button': {
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
    '>span': {
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
