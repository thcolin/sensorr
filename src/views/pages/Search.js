import React, { Fragment, useMemo } from 'react'
import { compose } from 'redux'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import Items from 'components/Layout/Items'
import { Input } from 'components/Layout/Controls'
import withTMDBQuery from 'components/Layout/Items/withTMDBQuery'
import withControls from 'components/Layout/Items/withControls'
import Film from 'components/Entity/Film'
import Persona from 'components/Entity/Persona'
import { setHistoryState } from 'utils/history'

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  option: {
    textDecoration: 'none',
    color: 'white',
    fontWeight: 600,
    transition: 'opacity 400ms ease-in-out',
    ':not(:last-child)': {
      marginRight: '2em',
    },
    '>span': {
      '&:first-child': {
        marginRight: '0.5em',
      },
      '&:last-child': {
        fontSize: '0.875em',
      },
    },
  }
}

const Menu = ({
  filtering,
  filters,
  query,
  setQuery,
}) => (
  <>
    <Input key="query" value={query} onChange={setQuery} />
    <div key="summary">
      {filters.subject.options.map(option => (
        <Link
          to={`/search/${option.value}/${query}`}
          css={styles.option}
          style={{ opacity: option.value === filtering.subject ? 1 : 0.5 }}
        >
          <span>{option.emoji}</span>
          <span>{option.label}</span>
        </Link>
      ))}
    </div>
  </>
)

const Filters = {
  query: () => ({
    label: 'Query',
    type: 'input',
    default: '',
    apply: () => true,
    serialize: (value) => ({ query: value })
  }),
  subject: () => ({
    label: '',
    type: 'radio',
    default: 'movie',
    options: [
      {
        value: 'movie',
        label: 'Movie',
        emoji: '🎞️',
      },
      {
        value: 'collection',
        label: 'Collection',
        emoji: '📚',
      },
      {
        value: 'person',
        label: 'Star',
        emoji: '⭐',
      },
    ],
    default: 'strict',
    apply: () => true,
  }),
}

const Search = ({ history, match, ...props }) => {
  const { subject, query = '' } = match.params

  const SearchItems = useMemo(() => compose(
    withTMDBQuery({
      uri: ['search', subject],
      params: { query: query },
    }, null, true),
    withControls({
      label: () => null,
      filters: Filters,
      render: {
        menu: Menu,
      },
      initial: {
        query: query,
        filtering: {
          subject: subject,
        },
        sorting: '',
        reverse: false,
      },
      defaults: {
        query: '',
        filtering: {
          subject: 'movie',
        },
        sorting: '',
        reverse: false,
      },
    })
  )(Items), [subject, query])

  return (
    <Fragment>
      <Helmet>
        <title>Sensorr - Search {subject} ({query})</title>
      </Helmet>
      <div css={styles.wrapper}>
        <SearchItems
          display="virtual-grid"
          child={{
            movie: Film,
            collection: Film,
            person: Persona,
          }[subject]}
          props={{
            movie: {},
            collection: {
              withState: false,
              link: (entity) => `/collection/${entity.id}`,
            },
            person: { display: 'portrait' },
          }[subject]}
          placeholders={history.location.state?.items?.total || null}
          onFetched={({ total }) => setHistoryState({ items: { total } })}
          onControls={({ filtering: { subject: s, query: q }}) => {
            if (query === q && subject === s) {
              return
            }

            history.push(`/search/${s}/${q}`)
          }}
          empty={{
            emoji: '🔍',
            title: "Sorry, no results",
            subtitle: (
              <span>
                Try something more familiar, like <em>{{
                  movie: 'Pulp Fiction',
                  collection: 'Star Wars',
                  person: 'Steven Spielberg',
                }[subject]}</em> ?
              </span>
            ),
          }}
        />
      </div>
    </Fragment>
  )
}

export default Search
