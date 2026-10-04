import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { Button, Option } from '@sensorr/ui'
import { emojize, useTitle } from '@sensorr/utils'
import Body from '../../layout/Body/Body'
import { useConfigContext } from '../../contexts/Config/Config'
import { useTMDB } from '../../store/tmdb'
import { HomeKey, List, Row, listRowId, listsOf } from '../Home/rows'
import { ListRow, screenOf, summaryOf } from '../Home/Items/List'

const MEDIA = { movie: emojize('🍿', 'Movies'), tv: emojize('📺', 'TV') }
const KINDS = { discover: emojize('🌍', 'TMDB'), library: emojize('📚', 'Library'), custom: emojize('✍️', 'Custom') }
const HOMES: { [home in HomeKey]: { emoji: string, label: string } } = {
  all: { emoji: '🖥️', label: 'Browser' },
  movie: { emoji: '🍿', label: 'Movies' },
  tv: { emoji: '📺', label: 'TV' },
}

const Lists = ({ ...props }) => {
  useTitle('Settings - Lists')
  const { onSave } = useOutletContext() as any
  const { config } = useConfigContext()
  const tmdb = useTMDB()
  const [lists, setLists] = useState<List[]>(() => listsOf(config))
  const [homes, setHomes] = useState<{ [home in HomeKey]: Row[] }>(() => config.get('home'))
  const [name, setName] = useState('')
  const [media, setMedia] = useState<'movie' | 'tv'>('movie')

  // A filter saved as bare ids, the genres or the lists of Library, reads by name
  const names = { ...tmdb.genres, ...tmdb.tvGenres, ...Object.fromEntries(lists.map((list) => [list.id, list])) }
  const dirty = JSON.stringify(lists) !== JSON.stringify(listsOf(config)) || JSON.stringify(homes) !== JSON.stringify(config.get('home'))

  const setList = (id: string, change: (list: List) => List) => setLists((lists) => lists.map((list) => list.id === id ? change(list) : list))
  const pinned = (key: HomeKey, list: List) => homes[key].some(({ id }) => id === listRowId(list))
  const pin = (key: HomeKey, list: List) => setHomes((homes) => ({
    ...homes,
    [key]: pinned(key, list) ? homes[key].filter(({ id }) => id !== listRowId(list)) : [...homes[key], { id: listRowId(list), hidden: false }],
  }))

  return (
    <Body>
      <section>
        <article>
          <h2>Lists</h2>
          <p>
            A list is a row you can show on a Home. It follows the filters you saved from <Link to='/movie/discover'>Discover</Link> or <Link to='/movie/library'>Library</Link>, the movies and shows you add to it from their page or from Library, or both, one after the other.
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
              const home = Object.fromEntries(Object.entries(homes).map(([key, rows]) => [key, rows.filter(({ id }) => !id.startsWith('list:') || ids.includes(id))]))
              // The config reloads in place: a new state redraws Save as saved
              onSave({ lists, home }).then(() => setLists((lists) => [...lists]), () => null)
            }}
          >
            {!lists.length ? (
              <p sx={Lists.styles.empty}>
                No list yet. Save the filters of <Link to='/movie/discover'>Discover</Link> or <Link to='/movie/library'>Library</Link> as a list, or name a custom list above.
              </p>
            ) : lists.map((list) => (
              <div key={list.id} sx={Lists.styles.list} role='group' aria-label={list.name}>
                <div>
                  <input
                    type='text'
                    value={list.name}
                    onChange={(e) => setList(list.id, (list) => ({ ...list, name: e.target.value }))}
                    aria-label='Name of the list'
                    required={true}
                  />
                  <div role='group' aria-label='Homes that show it'>
                    <span>On</span>
                    {(['all', list.media] as HomeKey[]).map((key) => (
                      <Option key={key} id={`pin-${list.id}-${key}`} type='checkbox' checked={pinned(key, list)} onChange={() => pin(key, list)}>
                        {emojize(HOMES[key].emoji, HOMES[key].label)}
                      </Option>
                    ))}
                  </div>
                  <button
                    type='button'
                    title='Delete the list'
                    onClick={() => window.confirm(`Delete "${list.name}"? It leaves every Home once you Save.`) && setLists((lists) => lists.filter(({ id }) => id !== list.id))}
                  >
                    ✕
                  </button>
                </div>
                <ListRow
                  list={list}
                  label={null}
                  hide={false}
                  empty={{ emoji: '🗂️', title: 'Nothing in it yet', subtitle: list.sources.some(({ kind }) => kind === 'custom') ? `Add ${list.media === 'movie' ? 'movies' : 'shows'} from their page or from Library` : 'Its filters match nothing' }}
                />
                {/* `article` indents every list of Settings */}
                <ul style={{ paddingLeft: 0 }}>
                  {list.sources.map((source, index) => (
                    <li key={index}>
                      <strong>{KINDS[source.kind]}</strong>
                      <span>{source.kind === 'custom' ? `${list.media === 'movie' ? 'Movies' : 'Shows'} you added` : summaryOf(list, source, names).join(' · ') || 'Every one'}</span>
                      {dirty ? (
                        <span title='Save first, leaving drops the changes' sx={{ opacity: 0.45, cursor: 'not-allowed' }}>{source.kind === 'custom' ? 'Open' : 'Edit'}</span>
                      ) : (
                        <Link {...screenOf(list, index, source.kind !== 'custom')}>{source.kind === 'custom' ? 'Open' : 'Edit'}</Link>
                      )}
                      <button
                        type='button'
                        title={list.sources.length === 1 ? 'A list keeps one source at least' : 'Remove from the list'}
                        disabled={list.sources.length === 1}
                        onClick={() => setList(list.id, (list) => ({ ...list, sources: list.sources.filter((_, other) => other !== index) }))}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div sx={Lists.styles.save}>
              <Button type='submit' color='primary' disabled={!dirty} title={dirty ? undefined : 'Nothing to save'} sx={{ flex: 1 }}>Save</Button>
            </div>
          </form>
        </article>
      </section>
    </Body>
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
      flexWrap: 'wrap',
      gap: 6,
      '>input': {
        variant: 'input.reset',
        flex: '1 1 12em',
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
      '>div': {
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 5,
        whiteSpace: 'nowrap',
        '>span': {
          color: 'grayDarkest',
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
      '&& >li': {
        marginLeft: '0px',
        paddingLeft: '0px',
      },
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
        '>span:first-of-type': {
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: ['normal', 'nowrap'],
          color: 'grayDarkest',
        },
        '>a, >span:not(:first-of-type)': {
          fontWeight: 'semibold',
        },
        '>button': {
          variant: 'button.reset',
          paddingX: 8,
          color: 'error',
          '&:disabled': {
            opacity: 0.3,
            cursor: 'default',
          },
        },
      },
    },
  },
  // The save of the whole page stays in reach below a long list
  save: {
    position: 'sticky',
    bottom: '0px',
    display: 'flex',
    marginTop: 4,
    paddingY: 8,
    backgroundColor: 'white',
  },
}

export default Lists
