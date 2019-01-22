import React, { PureComponent, Fragment } from 'react'
import { Helmet } from 'react-helmet'
import { Link } from 'react-router-dom'
import Grid from 'components/Layout/Grid'
import Persona from 'components/Entity/Persona'
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
    fontSize: '1.25em',
    padding: '0.75em 1em',
    margin: 0,
    textAlign: 'center',
    color: theme.colors.secondary,
    fontFamily: 'inherit',
  },
  wrapper: {
    padding: '2em 0',
  },
  link: {
    color: theme.colors.primary,
  },
}

export default class Following extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      query: '',
    }

    this.handleQueryChange = this.handleQueryChange.bind(this)
  }

  handleQueryChange(e) {
    this.setState({ query: e.target.value })
  }

  render() {
    const { query } = this.state
    const { ...props } = this.props

    return (
      <Fragment>
        <Helmet>
          <title>Sensorr - Following</title>
        </Helmet>
        <div>
          <div style={styles.filter}>
            <input
              type="text"
              onKeyUp={this.handleQueryChange}
              style={styles.input}
              placeholder="Filter..."
            />
          </div>
          <div style={styles.wrapper}>
            <Grid
              query={(db) => db.stars.find().where('state').ne('ignored')}
              filter={entity => [entity.name, ...(entity.also_known_as || [])].some(string => new RegExp(query, 'i').test(string))}
              child={(props) => <Persona context="portrait" {...props} />}
              empty={{
                emoji: '👩‍🎤',
                title: "Oh no, you are not following anyone",
                subtitle: (
                  <span>
                    You should try to <Link to="/stars/search/" style={styles.link}>search</Link> for stars and start following them !
                  </span>
                ),
              }}
            />
          </div>
        </div>
      </Fragment>
    )
  }
}
