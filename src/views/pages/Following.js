import React, { Fragment } from 'react'
import { compose } from 'redux'
import * as Emotion from '@emotion/core'
import { Helmet } from 'react-helmet'
import Items from 'components/Layout/Items'
import withDatabaseQuery from 'components/Layout/Items/withDatabaseQuery'
import withControls from 'components/Layout/Items/withControls'
import Person from 'components/Entity/Person'
import { Star } from 'shared/Documents'
import { setHistoryState } from 'utils/history'
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
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
}

const FollowingItems = compose(
  withDatabaseQuery((db) => db.stars.find().where('state').ne('ignored'), true),
  withControls({
    label: ({ total, reset }) => (
      <button css={theme.resets.button} onClick={() => reset()}>
        <span><strong>{total}</strong> Stars</span>
      </button>
    ),
    filters: Star.Filters,
    sortings: Star.Sortings,
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
          {Emotion.jsx(blocks.known_for_department.element, blocks.known_for_department.props)}
          {Emotion.jsx(blocks.gender.element, blocks.gender.props)}
          <div css={[theme.styles.row, theme.styles.spacings.row]}>
            {Emotion.jsx(blocks.birth.element, { ...blocks.birth.props, display: 'column' })}
            {Emotion.jsx(blocks.popularity.element, { ...blocks.popularity.props, display: 'column' })}
          </div>
          {Emotion.jsx(blocks.sorting.element, blocks.sorting.props)}
        </>
      ),
    },
  }),
)(Items)

const Following = ({ history, ...props }) => (
  <Fragment>
    <Helmet>
      <title>Sensorr - Following</title>
    </Helmet>
    <div css={styles.wrapper}>
      <FollowingItems
        display="virtual-grid"
        child={Person}
        props={{ display: 'portrait' }}
        placeholders={history.location.state?.items?.total || null}
        onFetched={({ total }) => setHistoryState({ items: { total } })}
        empty={{
          emoji: '👩‍🎤',
          title: "Oh no, you are not following anyone",
          subtitle: (
            <span>
              You should try to search for stars and start following them !
            </span>
          ),
        }}
      />
    </div>
  </Fragment>
)

export default Following
