import React, { Fragment } from 'react'
import { compose } from 'redux'
import * as Emotion from '@emotion/core'
import { Helmet } from 'react-helmet'
import Items from 'components/Layout/Items'
import withDatabaseQuery from 'components/Layout/Items/withDatabaseQuery'
import withControls from 'components/Layout/Items/withControls'
import Movie from 'components/Entity/Movie'
import * as Documents from 'shared/Documents'
import { setHistoryState } from 'utils/history'
import theme from 'theme'

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
}

const LibraryItems = compose(
  withDatabaseQuery((db) => db.movies.find().where('state').ne('ignored'), true),
  withControls({
    label: ({ total, reset }) => (
      <button css={theme.resets.button} onClick={() => reset()}>
        <span><strong>{total}</strong> Movies</span>
      </button>
    ),
    filters: Documents.Movie.Filters,
    sortings: Documents.Movie.Sortings,
    initial: () => ({
      filtering: window?.history?.state?.state?.controls?.filtering || {},
      sorting: window?.history?.state?.state?.controls?.sorting || 'time',
      reverse: window?.history?.state?.state?.controls?.reverse || false,
    }),
    defaults: {
      filtering: {},
      sorting: 'time',
      reverse: false,
    },
    render: {
      pane: (blocks) => (
        <>
          {Emotion.jsx(blocks.genre.element, blocks.genre.props)}
          {Emotion.jsx(blocks.state.element, blocks.state.props)}
          <div css={[theme.styles.row, theme.styles.spacings.row]}>
            {Emotion.jsx(blocks.year.element, { ...blocks.year.props, display: 'column' })}
            {Emotion.jsx(blocks.popularity.element, { ...blocks.popularity.props, display: 'column' })}
            {Emotion.jsx(blocks.vote_average.element, { ...blocks.vote_average.props, display: 'column' })}
            {Emotion.jsx(blocks.runtime.element, { ...blocks.runtime.props, display: 'column' })}
          </div>
          {Emotion.jsx(blocks.sorting.element, blocks.sorting.props)}
        </>
      ),
    },
    history: history,
  }),
)(Items)

const Library = ({ history, ...props }) => (
  <Fragment>
    <Helmet>
      <title>Sensorr - Library</title>
    </Helmet>
    <div css={styles.wrapper}>
      <LibraryItems
        display="virtual-grid"
        child={Movie}
        placeholders={history.location.state?.items?.total || null}
        onFetched={({ total }) => setHistoryState({ items: { total } })}
        empty={{
          emoji: '🍿',
          title: "Oh no, your collection is empty",
          subtitle: (
            <span>
              You should try to search for wished movie, <em>Interstellar</em> maybe ?
            </span>
          ),
        }}
      />
    </div>
  </Fragment>
)

export default Library
