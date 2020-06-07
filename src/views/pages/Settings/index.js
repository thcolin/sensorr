import React, { PureComponent, Fragment } from 'react'
import { Switch, Route } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { withToastManager } from 'react-toast-notifications'
import About from './blocks/About'
import Authentication from './blocks/Authentication'
import Region from './blocks/Region'
import Records from './blocks/Records'
import TMDB from './blocks/TMDB'
import Blackhole from './blocks/Blackhole'
import XZNAB from './blocks/XZNAB'
import Policy from './blocks/Policy'
import Plex from './blocks/Plex'
import Database from './blocks/Database'
import sensorr from 'store/sensorr'
import theme from 'theme'

export const styles = {
  element: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '2em 2em 3em',
  },
  column: {
    display: 'flex',
  },
  section: {
    padding: '2em 1em',
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    padding: '0 0 0.5em',
    fontSize: '2em',
    fontWeight: 'bold',
    color: theme.colors.black,
  },
  subtitle: {
    padding: '0 0 0.25em',
    fontSize: '1.5em',
    fontWeight: 'bold',
    color: theme.colors.black,
  },
  paragraph: {
    lineHeight: 1.75,
    color: theme.colors.black,
  },
  list: {
    lineHeight: 1.75,
    listStyle: 'inside',
  },
  link: {
    color: theme.colors.primary,
  },
  select: {
    width: '100%',
    padding: '0.5em',
    margin: '1em 0',
    fontSize: '0.875em',
    borderRadius: 0,
    border: `0.0625em solid ${theme.colors.gray}`,
    WebkitAppearance: 'none',
    background: theme.colors.white,
  },
  input: {
    width: '100%',
    padding: '0.5em',
    margin: '1em 0',
    fontSize: '0.875em',
    whiteSpace: 'nowrap',
    borderRadius: 0,
    border: `0.0625em solid ${theme.colors.gray}`,
  },
  checkbox: {
    padding: '0.5em',
  },
  code: {
    backgroundColor: theme.colors.primary,
    padding: '0.125em 0.375em',
    borderRadius: '0.25em',
    fontFamily: theme.fonts.secondary,
    fontSize: '0.875em',
    fontWeight: 600,
    color: theme.colors.white,
  },
  button: {
    cursor: 'pointer',
    backgroundColor: theme.colors.primary,
    color: theme.colors.white,
    padding: '1em 1.25em 0.75em',
    border: 'none',
    fontFamily: theme.fonts.primary,
    fontSize: '1.125em',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },
  remove: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    padding: '0 0 0 1em',
  },
  add: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    padding: '1em',
  }
}

const Submit = () => (
  <button type="submit" style={{ ...styles.button, marginTop: '1em' }}>
    💾&nbsp;&nbsp;Save
  </button>
)

class Settings extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      values: {
        ...sensorr.config,
        region: global.config.region || localStorage.getItem('region') || window.navigator.languages.filter(region => region.match(/-/)).reverse().pop() || 'en-US',
      },
    }

    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleChange = this.handleChange.bind(this)
  }

  handleSubmit(e) {
    e.preventDefault()

    const { toastManager } = this.props
    const payload = {
      ...this.state.values,
      xznabs: this.state.values.xznabs.filter(xznab => xznab.name && xznab.url && xznab.key)
    }

    fetch('/api/configure', {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Basic ${new Buffer(`${sensorr.config.auth.username}:${sensorr.config.auth.password}`).toString('base64')}`,
      }),
      body: JSON.stringify({ config: payload }),
    })
    .then(res => {
      try {
        res.json().then(body => {
          if (res.ok) {
            toastManager.add((
              <span>Configuration updated ! Reloading page...</span>
            ), { appearance: 'success', autoDismiss: true, })
            setTimeout(() => location.reload(), 5000)
          } else {
            toastManager.add((
              <span>Something went wrong during configuration update : <strong>{body.reason}</strong></span>
            ), { appearance: 'error', autoDismiss: true, })
          }
        })
      } catch(e) {
        toastManager.add((
          <span>Unexpected error during configuration update : <strong>{res.statusText}</strong></span>
        ), { appearance: 'error', autoDismiss: true, })
      }
    })
  }

  handleChange(key, value) {
    this.setState({
      values: {
        ...this.state.values,
        [key]: value,
      },
    })
  }

  render() {
    const { values } = this.state

    return (
      <Fragment>
        <Helmet>
          <title>Sensorr - Settings</title>
        </Helmet>
        <form style={styles.element} onSubmit={this.handleSubmit}>
          <Switch>
            <Route
              path="/settings"
              exact={true}
              render={() => (
                <>
                  <About values={values} handleChange={this.handleChange} />
                  <Authentication values={values} handleChange={this.handleChange} />
                  <TMDB values={values} handleChange={this.handleChange} />
                  <Region values={values} handleChange={this.handleChange} />
                  <Submit />
                </>
              )}
            />
            <Route
              path="/settings/downloads"
              exact={true}
              render={() => (
                <>
                  <Records values={values} handleChange={this.handleChange} />
                  <Blackhole values={values} handleChange={this.handleChange} />
                  <XZNAB values={values} handleChange={this.handleChange} />
                  <Policy values={values} handleChange={this.handleChange} />
                  <Submit />
                </>
              )}
            />
            <Route
              path="/settings/plex"
              exact={true}
              render={() => (
                <Plex values={values} handleChange={this.handleChange} />
              )}
            />
            <Route
              path="/settings/database"
              exact={true}
              render={() => (
                <Database />
              )}
            />
          </Switch>
        </form>
      </Fragment>
    )
  }
}

export default withToastManager(Settings)
