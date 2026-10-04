import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { Button } from '@sensorr/ui'
import { emojize, useTitle } from '@sensorr/utils'
import Body from '../../layout/Body/Body'
import { useConfigContext } from '../../contexts/Config/Config'
import { HomeKey, List, Row, listRowId, listsOf } from '../Home/rows'
import { screenOf, summaryOf } from '../Home/Items/List'
import { useTMDB } from '../../store/tmdb'

const MEDIA = { movie: emojize('🍿', 'movie'), tv: emojize('📺', 'tv') }
const KINDS = { discover: '🌍', library: '📚', manual: '✋' }
const HOMES: { [home in HomeKey]: string } = { all: 'Browser', movie: 'Movies', tv: 'TV' }

const Lists = ({ ...props }) => {
  useTitle('Settings - Lists')
  const { onSave } = useOutletContext() as any
  const { config } = useConfigContext()
  const tmdb = useTMDB()
  const genres = { ...tmdb.genres, ...tmdb.tvGenres }
  const [lists, setLists] = useState<List[]>(() => listsOf(config))
  const [name, setName] = useState('')
  const [media, setMedia] = useState<'movie' | 'tv'>('movie')
  const home: { [home in HomeKey]: Row[] } = config.get('home')

  const setList = (id: string, change: (list: List) => List) => setLists((lists) => lists.map((list) => list.id === id ? change(list) : list))

  return (
    <Body>
      <section>
        <article>
          <h2>Lists</h2>
          <p>
            A list shows on a Home as a row: the movies or the shows of its sources, one source after the other.
            {' '}Save one from the filters of <Link to='/movie/discover'>Discover</Link> or <Link to='/movie/library'>Library</Link>, or start one here and add to it from a movie page or the bulk actions of Library.
            {' '}Pin a list on a Home from <Link to='/settings/home'>Home</Link>.
          </p>
          <form
            sx={Lists.styles.create}
            onSubmit={(e) => {
              e.preventDefault()
              setLists((lists) => [...lists, { id: nanoid(8), name: name.trim(), media, sources: [{ kind: 'manual' }] }])
              setName('')
            }}
          >
            <input type='text' value={name} onChange={(e) => setName(e.target.value)} placeholder='Name of a list added to by hand' aria-label='Name of the new list' required={true} sx={{ variant: 'input.default', flex: 1, fontFamily: 'monospace', minWidth: 0 }} />
            <select value={media} onChange={(e) => setMedia(e.target.value as 'movie' | 'tv')} aria-label='Media of the new list' sx={{ variant: 'select.default', width: 'auto', flex: '0 0 auto' }}>
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
              const rows = Object.fromEntries(Object.entries(home).map(([key, rows]) => [key, rows.filter(({ id }) => !id.startsWith('list:') || ids.includes(id))]))
              onSave({ lists, home: rows })
            }}
          >
            {!lists.length ? (
              <p sx={Lists.styles.empty}>
                No list yet. Save filters from <Link to='/movie/discover'>Discover</Link> or <Link to='/movie/library'>Library</Link>, or add a movie from its page.
              </p>
            ) : (
              <ul sx={Lists.styles.lists}>
                {lists.map((list) => {
                  const pinned = (Object.keys(HOMES) as HomeKey[]).filter((key) => home[key]?.some(({ id }) => id === listRowId(list)))

                  return (
                    <li key={list.id} sx={Lists.styles.list}>
                      <details>
                        <summary>
                          <input
                            type='text'
                            value={list.name}
                            onChange={(e) => setList(list.id, (list) => ({ ...list, name: e.target.value }))}
                            onClick={(e) => e.preventDefault()}
                            onKeyUp={(e) => e.preventDefault()}
                            aria-label='Name of the list'
                            required={true}
                            sx={Lists.styles.name}
                          />
                          <span sx={Lists.styles.cell}>{MEDIA[list.media]}</span>
                          <span sx={Lists.styles.cell}>{list.sources.length} source{list.sources.length === 1 ? '' : 's'}</span>
                          <span sx={{ ...Lists.styles.cell, display: ['none', 'flex'] }} title={pinned.length ? `On the ${pinned.map((key) => HOMES[key]).join(', ')} Home` : 'On no Home'}>
                            {pinned.length ? pinned.map((key) => HOMES[key]).join(', ') : '—'}
                          </span>
                          <button
                            type='button'
                            title='Delete the list'
                            onClick={(e) => {
                              e.preventDefault()

                              if (window.confirm(`Delete the list "${list.name}"? It leaves every Home once saved.`)) {
                                setLists((lists) => lists.filter(({ id }) => id !== list.id))
                              }
                            }}
                            sx={Lists.styles.remove}
                          >
                            ✕
                          </button>
                        </summary>
                        <ol sx={Lists.styles.sources}>
                          {list.sources.map((source, index) => (
                            <li key={index}>
                              <span title={source.kind}>{KINDS[source.kind]}</span>
                              <code title={summaryOf(list, source, genres)}>{summaryOf(list, source, genres)}</code>
                              {source.kind !== 'manual' ? (
                                <Link {...screenOf(list, index, true)}>Edit</Link>
                              ) : (
                                <Link {...screenOf(list, index)}>Open</Link>
                              )}
                              <button
                                type='button'
                                title={list.sources.length === 1 ? 'A list keeps one source at least' : 'Remove the source'}
                                disabled={list.sources.length === 1}
                                onClick={() => setList(list.id, (list) => ({ ...list, sources: list.sources.filter((_, other) => other !== index) }))}
                                sx={Lists.styles.drop}
                              >
                                ✕
                              </button>
                            </li>
                          ))}
                        </ol>
                      </details>
                    </li>
                  )
                })}
              </ul>
            )}
            <div sx={{ display: 'flex', marginTop: 4 }}>
              <Button type='submit' color='primary' sx={{ flex: 1 }}>Save</Button>
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
  lists: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    listStyle: 'none',
    '&&': {
      paddingLeft: '0px',
      marginLeft: '0px',
    },
    marginY: 4,
  },
  list: {
    border: '1px solid',
    borderColor: 'grayDark',
    borderRadius: '0.25rem',
    backgroundColor: 'whiteDark',
    '>details >summary': {
      display: 'flex',
      alignItems: 'stretch',
      minHeight: '3em',
      cursor: 'pointer',
      listStyle: 'none',
      '::-webkit-details-marker': {
        display: 'none',
      },
      '::before': {
        content: '"▸"',
        display: 'flex',
        alignItems: 'center',
        paddingX: 8,
        fontFamily: 'monospace',
        borderRight: '1px solid',
        borderColor: 'grayDark',
      },
    },
    '>details[open] >summary::before': {
      content: '"▾"',
    },
  },
  name: {
    variant: 'input.reset',
    flex: 1,
    minWidth: 0,
    paddingX: 6,
    fontWeight: 'semibold',
    textOverflow: 'ellipsis',
    ':focus-visible': {
      outline: '2px solid',
      outlineColor: 'primary',
      outlineOffset: '-2px',
    },
  },
  cell: {
    display: 'flex',
    alignItems: 'center',
    paddingX: 6,
    borderLeft: '1px solid',
    borderColor: 'grayDark',
    fontFamily: 'monospace',
    fontSize: 6,
    color: 'grayDarkest',
    whiteSpace: 'nowrap',
  },
  remove: {
    variant: 'button.reset',
    paddingX: 6,
    backgroundColor: 'error',
    color: 'whitePure',
    borderTopRightRadius: '0.25rem',
    borderBottomRightRadius: '0.25rem',
    '&:hover': {
      backgroundColor: 'errorDarker',
    },
    '&:active': {
      backgroundColor: 'errorDarkest',
    },
  },
  sources: {
    listStyle: 'none',
    padding: 12,
    margin: 12,
    borderTop: '1px solid',
    borderColor: 'grayDark',
    '>li': {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      paddingX: 6,
      paddingY: 8,
      ':not(:last-of-type)': {
        borderBottom: '1px solid',
        borderColor: 'grayDark',
      },
      '>code': {
        flex: 1,
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontSize: 6,
      },
      '>a': {
        fontSize: 6,
        fontWeight: 'semibold',
      },
    },
  },
  drop: {
    variant: 'button.reset',
    paddingX: 8,
    color: 'error',
    '&:disabled': {
      opacity: 0.3,
      cursor: 'default',
    },
  },
}

export default Lists
