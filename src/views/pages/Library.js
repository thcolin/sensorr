import React, { Fragment } from 'react'
import * as Emotion from '@emotion/core'
import { Helmet } from 'react-helmet'
import Grid from 'components/Layout/Grid'
import Film from 'components/Entity/Film'
import { Movie } from 'shared/Documents'
import theme from 'theme'

const styles = {
  filter: {
    zIndex: 1,
    position: 'sticky',
    top: '-1px',
    width: '100%',
  },
  input: {
    width: '100%',
    backgroundColor: theme.colors.grey,
    border: 'none',
    fontSize: '1.125em',
    padding: '0.792em 1em',
    margin: 0,
    textAlign: 'center',
    color: theme.colors.secondary,
    fontFamily: 'inherit',
    outline: 'none',
  },
  state: {
    position: 'absolute',
    cursor: 'pointer',
    right: '1em',
    top: '0.375em',
    fontSize: '2em',
    userSelect: 'none',
    MozUserSelect: 'none',
    WebkitUserSelect: 'none',
  },
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  grid: {
    padding: '2em 0',
  },
}

const Library = ({ ...props }) => (
  <Fragment>
    <Helmet>
      <title>Sensorr - Library</title>
    </Helmet>
    <div css={styles.wrapper}>
      <Grid
        limit={true}
        strict={false}
        query={(db) => db.movies.find().where('state').ne('ignored')}
        child={Film}
        css={styles.grid}
        placeholder={true}
        controls={{
          label: ({ total, reset }) => (
            <button css={theme.resets.button} onClick={() => reset()}>
              <span><strong>{total}</strong> Movies</span>
            </button>
          ),
          filters: Movie.Filters,
          sortings: Movie.Sortings,
          defaults: {
            filtering: {},
            sorting: Movie.Sortings.time,
            reverse: false,
          },
          render: {
            filters: (blocks) => (
              <>
                {Emotion.jsx(blocks.genre.element, blocks.genre.props)}
                {Emotion.jsx(blocks.state.element, blocks.state.props)}
                <div css={[theme.styles.row, theme.styles.spacings.row]}>
                  {Emotion.jsx(blocks.year.element, { ...blocks.year.props, display: 'column' })}
                  {Emotion.jsx(blocks.popularity.element, { ...blocks.popularity.props, display: 'column' })}
                  {Emotion.jsx(blocks.vote_average.element, { ...blocks.vote_average.props, display: 'column' })}
                  {Emotion.jsx(blocks.runtime.element, { ...blocks.runtime.props, display: 'column' })}
                </div>
              </>
            ),
          }
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

export default Library
