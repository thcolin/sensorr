import React, { Fragment } from 'react'
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

const Following = ({ ...props }) => {
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
          child={(props) => <Persona context="portrait" {...props} />}
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
              filtering: {},
              sorting: Star.Sortings.time,
              reverse: false,
            },
            render: {
              filters: (Blocks) => (
                <>
                  <Blocks.known_for_department />
                  <Blocks.gender />
                  <div css={[theme.styles.row, theme.styles.spacings.row]}>
                    <Blocks.birth display="column" />
                    <Blocks.popularity display="column" />
                  </div>
                </>
              ),
            },
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

export default Following
