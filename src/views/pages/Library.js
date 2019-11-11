import React, { Fragment } from 'react'
import * as Emotion from '@emotion/core'
import { Helmet } from 'react-helmet'
import Grid from 'components/Layout/Grid'
import Film from 'components/Entity/Film'
import { Movie } from 'shared/Documents'
import theme from 'theme'

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  grid: {
    padding: '2em 0',
  },
}

const Pane = (blocks) => (
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
)

const Library = ({ history, ...props }) => (
  <Fragment>
    <Helmet>
      <title>Sensorr - Library</title>
    </Helmet>
    <div css={styles.wrapper}>
      <Grid
        limit={true}
        strict={false}
        query={Library.query}
        child={Film}
        css={styles.grid}
        placeholder={true}
        history={history}
        defaults={{
          max: ((history.location.state || {}).grid || {}).max,
        }}
        controls={{
          label: ({ total, reset }) => (
            <button css={theme.resets.button} onClick={() => reset()}>
              <span><strong>{total}</strong> Movies</span>
            </button>
          ),
          filters: Movie.Filters,
          sortings: Movie.Sortings,
          defaults: {
            filtering: ((history.location.state || {}).controls || {}).filtering || {},
            sorting: ((history.location.state || {}).controls || {}).sorting || 'time',
            reverse: ((history.location.state || {}).controls || {}).reverse || false,
          },
          render: {
            pane: Pane,
          },
          history: history,
        }}
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

Library.query = (db) => db.movies.find().where('state').ne('ignored')

export default Library
