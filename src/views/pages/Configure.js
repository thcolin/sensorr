import React, { PureComponent, Fragment } from 'react'
import { countries, flag, name } from 'country-emoji'
import cl from 'country-language'
import { Helmet } from 'react-helmet'
import { withToastManager } from 'react-toast-notifications'
import sensorr from 'store/sensorr'
import theme from 'theme'

const styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    padding: '2em 2em 3em',
  },
  column: {
    display: 'flex',
  },
  section: {
    padding: '1em',
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    padding: '0 0 0.5em',
    fontSize: '2em',
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

const placeholder = {
  tmdb: 'TMDB API Key (v3 auth)',
  blackhole: '/tmp',
  xznab: {
    name: 'Name',
    url: 'http://localhost:5060/torznab/aggregate/api',
    key: 'API Key',
  },
  filter: 'resolution=720p|1080p, source=BLURAY',
  sort: 'seeders',
}

class Configure extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      values: {
        ...sensorr.config,
        region: global.config.region || localStorage.getItem('region') || window.navigator.languages.filter(region => region.match(/-/)).reverse().pop() || 'en-US',
      },
      regions: [],
    }

    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleChange = this.handleChange.bind(this)
  }

  componentDidMount() {
    Promise.all(
      Object.keys(countries).map(country => new Promise(resolve => cl.getCountryLanguages(country, (err, languages) => {
        if (!err && languages && languages.length && languages[0].iso639_1) {
          resolve({ country, language: languages[0].iso639_1, emoji: flag(country), name: name(country) })
        } else {
          resolve(null)
        }
      })))
    )
    .then(regions => this.setState({
      regions: regions.filter(region => region)
    }))
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
    const { values, regions } = this.state

    return (
      <Fragment>
        <Helmet>
          <title>Sensorr - Configure</title>
        </Helmet>
        <form style={styles.element} onSubmit={this.handleSubmit}>
          <div style={styles.section}>
            <h1 style={styles.title}>Region</h1>
            <p style={styles.paragraph}>
              When you <code style={styles.code}>wish</code> a movie, all data about movie (like title, year and stuff) are saved from <a href="https://www.themoviedb.org/" style={styles.link}>The Movie Database</a> in configured region language.
              <br/>
              <br/>
              You can overide it here, just select your <code style={styles.code}>region</code> :
            </p>
            <select style={styles.select} value={values.region} onChange={(e) => this.handleChange('region', e.target.value)}>
              {regions.sort((a, b) => a.name.localeCompare(b.name)).map(region => (
                <option key={region.country} value={`${region.language}-${region.country}`}>
                  {region.name} {region.emoji}
                </option>
              ))}
            </select>
          </div>
          <div style={styles.section}>
            <h1 style={styles.title}>Authentication</h1>
            <p style={styles.paragraph}>
              To securize your Sensorr instance you can fill a username and a password. Leave blank for no authentication.
              <br/>
              <br/>
              Specify <code style={styles.code}>username</code> and <code style={styles.code}>password</code> :
            </p>
            <div style={styles.column}>
              <input
                type="text"
                placeholder={'Username'}
                style={{ ...styles.input, marginRight: '1em', }}
                defaultValue={values.auth.username}
                onChange={e => this.handleChange('auth', { ...values.auth, username: e.target.value })}
              />
              <input
                type="text"
                placeholder={'Password'}
                style={{ ...styles.input, marginLeft: '1em', }}
                defaultValue={values.auth.password}
                onChange={e => this.handleChange('auth', { ...values.auth, password: e.target.value })}
              />
            </div>
          </div>
          <div style={styles.section}>
            <h1 style={styles.title}>TMDB</h1>
            <p style={styles.paragraph}>
              Sensorr is powered by <a href="https://www.themoviedb.org/" style={styles.link}>The Movie Database</a> API, to works properly, you need to fill <a href="https://www.themoviedb.org/settings/api" style={styles.link}>your own API Key (v3 auth)</a>.
              <br/>
              <br/>
              Specify <code style={styles.code}>API Key</code> (v3 auth) :
            </p>
            <input
              type="text"
              placeholder={placeholder.tmdb}
              style={styles.input}
              defaultValue={values.tmdb}
              onChange={e => this.handleChange('tmdb', e.target.value)}
            />
          </div>
          <div style={styles.section}>
            <h1 style={styles.title}>Blackhole</h1>
            <p style={{ ...styles.paragraph, flex: 1, }}>
              Sensorr works with <strong>XZNAB</strong> API servers and will download any <code style={styles.code}>.torrent</code> or <code style={styles.code}>.nzb</code> file into defined Server <code style={styles.code}>blackhole</code> path.
              <br/>
              If you run Sensorr from <a href="https://hub.docker.com/r/thcolin/sensorr/" style={styles.link}>Docker</a> image, keep it to <code style={styles.code}>/app/sensorr/blackhole</code>.
              <br/>
              <br/>
            </p>
            <p style={styles.paragraph}>
              Here you need to fill <strong>server</strong> blackhole <strong>path</strong> :
            </p>
            <input
              type="text"
              placeholder={placeholder.blackhole}
              style={styles.input}
              defaultValue={values.blackhole}
              onChange={e => this.handleChange('blackhole', e.target.value)}
            />
          </div>
          <div style={styles.section}>
            <h1 style={styles.title}>XZNAB</h1>
            <p style={styles.paragraph}>
              Sensorr works with <strong>XZNAB</strong> (<a href="https://github.com/Sonarr/Sonarr/wiki/Implementing-a-Torznab-indexer" style={styles.link}>Torznab</a> or <a href="http://www.newznab.com/" style={styles.link}>Newznab</a>) API servers, add as many as you wish, they will be used to perform looks query.
              <br/>
              <br/>
            </p>
            <p style={styles.paragraph}>Example:</p>
            <ul style={styles.list}>
              <li>Jackett: <code style={styles.code}>http://localhost:9117/api/v2.0/indexers/xxx/results/torznab/</code></li>
              <li>Cardigann: <code style={styles.code}>http://localhost:5060/torznab/xxx/api</code> (don't forget <code style={styles.code}>/api</code> after copied Cardigann Torznab link !)</li>
            </ul>
            {(values.xznabs.length ? values.xznabs : [{ name: '', url: '', key: '' }]).map((xznab, index, self) => (
              <div style={styles.column} key={index}>
                <input
                  type="checkbox"
                  title={xznab.disabled ? 'Disabled' : 'Enabled'}
                  style={styles.checkbox}
                  checked={!xznab.disabled}
                  onChange={e => this.handleChange('xznabs', self.map((foo, i) => i === index ? { ...xznab, disabled: !e.target.checked } : foo))}
                />
                <input
                  type="text"
                  placeholder={placeholder.xznab.name}
                  style={{ ...styles.input, marginLeft: '1em', marginRight: '1em', }}
                  value={xznab.name}
                  onChange={e => this.handleChange('xznabs', self.map((foo, i) => i === index ? { ...xznab, name: e.target.value } : foo))}
                />
                <input
                  type="text"
                  placeholder={placeholder.xznab.url}
                  style={{ ...styles.input, marginLeft: '1em', marginRight: '1em', }}
                  value={xznab.url}
                  onChange={e => this.handleChange('xznabs', self.map((foo, i) => i === index ? { ...xznab, url: e.target.value } : foo))}
                />
                <input
                  type="text"
                  placeholder={placeholder.xznab.key}
                  style={{ ...styles.input, marginLeft: '1em', }}
                  value={xznab.key}
                  onChange={e => this.handleChange('xznabs', self.map((foo, i) => i === index ? { ...xznab, key: e.target.value } : foo))}
                />
                <div style={styles.remove} onClick={() => this.handleChange('xznabs', self.filter((foo, i) => i !== index))}>🗑️</div>
              </div>
            ))}
            <div style={styles.add} onClick={() => this.handleChange('xznabs', [...values.xznabs, { name: '', url: '', key: '' }])}>🌱</div>
          </div>
          <div style={styles.column}>
            <div style={styles.section}>
              <h1 style={styles.title}>Filter</h1>
              <p style={{ ...styles.paragraph, flex: 1, }}>
                When using CLI with <code style={styles.code}>-a</code> or <code style={styles.code}>--auto</code> option, results will be filtered with defined <code style={styles.code}>filter</code>
                &nbsp;
                This is just a <a href="https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/RegExp" style={styles.link}>RegExp</a>, you can have multiple filters, just separate theme with <code style={styles.code}>,</code>
                &nbsp;
                You can filter by specific property and normalized value, see <a href="https://raw.githubusercontent.com/thcolin/oleoo/master/src/rules.json" style={styles.link}>full list</a>.
                <br/>
                <br/>
              </p>
              <p style={styles.paragraph}>
                Here you need to specify comma separated <a href="https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/RegExp" style={styles.link}>RegExp</a> :
              </p>
              <input
                type="text"
                placeholder={placeholder.filter}
                style={styles.input}
                defaultValue={values.filter}
                onChange={e => this.handleChange('filter', e.target.value)}
              />
            </div>
            <div style={styles.section}>
              <h1 style={styles.title}>Sort</h1>
              <p style={{ ...styles.paragraph, flex: 1, }}>
                Same as filter, used by CLI with <code style={styles.code}>-a</code> or <code style={styles.code}>--auto</code> option to sort results, define sort property among :
                &nbsp;
                <code style={styles.code}>seeders</code>, <code style={styles.code}>peers</code> and <code style={styles.code}>size</code>
                <br/>
                <br/>
              </p>
              <p style={styles.paragraph}>
                Here you need to specify <strong>sort property</strong> :
              </p>
              <div style={styles.column}>
                <input
                  type="text"
                  placeholder={placeholder.sort}
                  style={styles.input}
                  defaultValue={values.sort}
                  onChange={e => this.handleChange('sort', e.target.value)}
                />
                <label htmlFor="descending" style={{ ...styles.input, borderColor: 'transparent' }}>
                  <input
                    id="descending"
                    type="checkbox"
                    defaultChecked={values.descending}
                    onChange={e => this.handleChange('descending', e.target.checked)}
                    style={{ marginRight: '1em', }}
                  />
                  Descending
                </label>
              </div>
            </div>
          </div>
          <button type="submit" style={{ ...styles.button, marginTop: '1em' }}>
            💾&nbsp;&nbsp;Save
          </button>
        </form>
      </Fragment>
    )
  }
}

export default withToastManager(Configure)
