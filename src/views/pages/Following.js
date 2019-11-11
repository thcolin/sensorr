import React, { Fragment } from 'react'
import * as Emotion from '@emotion/core'
import { Helmet } from 'react-helmet'
import Grid from 'components/Layout/Grid'
import Persona from 'components/Entity/Persona'
import { Star } from 'shared/Documents'
import theme from 'theme'

const Context = React.createContext()

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
  grid: {
    padding: '2em 0',
  },
}

const Pane = (blocks) => (
  <>
    {Emotion.jsx(blocks.known_for_department.element, blocks.known_for_department.props)}
    {Emotion.jsx(blocks.gender.element, blocks.gender.props)}
    <div css={[theme.styles.row, theme.styles.spacings.row]}>
      {Emotion.jsx(blocks.birth.element, { ...blocks.birth.props, display: 'column' })}
      {Emotion.jsx(blocks.popularity.element, { ...blocks.popularity.props, display: 'column' })}
    </div>
    {Emotion.jsx(blocks.sorting.element, blocks.sorting.props)}
  </>
)

const Following = ({ history, ...props }) => {
  return (
    <Fragment>
      <Helmet>
        <title>Sensorr - Following</title>
      </Helmet>
      <div css={styles.wrapper}>
        <Grid
          limit={true}
          strict={false}
          query={(db) => db.stars.find().where('state').ne('ignored')}
          child={Following.Childs.Persona}
          css={styles.grid}
          controls={{
            label: ({ total, reset }) => (
              <button css={theme.resets.button} onClick={() => reset()}>
                <span><strong>{total}</strong> Stars</span>
              </button>
            ),
            filters: Star.Filters,
            sortings: Star.Sortings,
            defaults: {
              filtering: ((history.location.state || {}).controls || {}).filtering || {},
              sorting: ((history.location.state || {}).controls || {}).sorting || 'time',
              reverse: ((history.location.state || {}).controls || {}).reverse || false,
            },
            render: {
              pane: Pane,
            },
            history: history,
          }}
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
}

Following.Childs = {
  Persona: (props) => <Persona display="portrait" {...props} />,
}

export default Following
