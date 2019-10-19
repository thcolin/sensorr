import React, { PureComponent } from 'react'
import { withToastManager } from 'react-toast-notifications'
import { styles } from '../index.js'
import { SCHEMAS } from 'shared/Database'
import sensorr from 'store/sensorr'
import theme from 'theme'

class Database extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      job: null,
      loading: false,
    }

    this.references = {
      load: React.createRef()
    }

    this.handleLoad = this.handleLoad.bind(this)
  }

  async handleLoad(e) {
    e.persist()

    const { toastManager } = this.props
    this.setState({ job: 'load', loading: true })

    const raw = new FormData()
    raw.append('dump', e.target.files[0])

    toastManager.add((
      <span>Loading <strong>{e.target.files[0].name}</strong> dump into your database...</span>
    ), { appearance: 'info', autoDismiss: true, })

    fetch('/api/load', {
      method: 'POST',
      headers: new Headers({
        'Authorization': `Basic ${new Buffer(`${sensorr.config.auth.username}:${sensorr.config.auth.password}`).toString('base64')}`,
      }),
      body: raw,
    })
    .then(res => {
      try {
        res.json().then(body => {
          if (res.ok) {
            toastManager.add((
              <span>Dump <strong>{e.target.files[0].name}</strong> loaded to your database !</span>
            ), { appearance: 'success', autoDismiss: true, })
          } else {
            toastManager.add((
              <span>Something went wrong during <strong>{e.target.files[0].name}</strong> load : <strong>{body.reason}</strong></span>
            ), { appearance: 'error', autoDismiss: true, })
          }
        })
      } catch(e) {
        toastManager.add((
          <span>Unexpected error during <strong>{release.title}</strong> load : <strong>{res.statusText}</strong></span>
        ), { appearance: 'error', autoDismiss: true, })
      }
    })
    .finally(() => {
      this.setState({ job: 'load', loading: false })
    })
  }

  render() {
    const { ...props } = this.props
    const { job, loading, ...state } = this.state

    return (
      <div css={styles.section}>
        <h1 css={styles.title}>Database</h1>
        <p css={styles.paragraph}>
          Want to work with <em>your data</em> ? Habit of <em>backup everything</em> ? You can dump and load your whole <strong>database</strong> ({Object.keys(SCHEMAS).join(', ')}) in JSON format !
          <br/>
          <br/>
        </p>
        <div css={styles.column}>
          <a
            href="/api/dump"
            download={true}
            css={[theme.resets.a, styles.button]}
            style={{
              flex: 1,
              margin: '0 10px 0 0',
              cursor: loading ? 'default' : 'pointer',
              textAlign: 'center',
            }}
          >
            <span>{loading ? '⌛' : '💾'}</span>
            <span>&nbsp;&nbsp;&nbsp;</span>
            <span>{loading ? 'Loading' : 'Dump'}</span>
          </a>
          <button
            type="button"
            css={styles.button}
            style={{
              flex: 1,
              margin: '0 0 0 10px',
              backgroundColor: theme.colors.secondary,
              cursor: loading ? 'default' : 'pointer',
            }}
            onClick={loading ? () => {} : () => this.references.load.current.click()}
          >
            <input type="file" ref={this.references.load} onChange={this.handleLoad} hidden={true} />
            <span>{loading ? '⌛' : '📡️'}</span>
            <span>&nbsp;&nbsp;&nbsp;</span>
            <span>{loading ? 'Loading' : 'Load'}</span>
          </button>
        </div>
      </div>
    )
  }
}

export default withToastManager(Database)
