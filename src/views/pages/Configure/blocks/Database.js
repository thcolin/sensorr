import React, { PureComponent } from 'react'
import { styles } from '../index.js'
import database from 'store/database'
import { SCHEMAS } from 'shared/Database'
import download from 'utils/download'
import theme from 'theme'

class Database extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      job: null,
      loading: false,
      total: 0,
    }

    this.references = {
      import: React.createRef()
    }

    this.handleDump = this.handleDump.bind(this)
    this.handleImport = this.handleImport.bind(this)
  }

  async handleDump() {
    this.setState({ job: 'dump', total: 0, loading: true })
    const db = await database.get()
    const dumps = await Promise.all(Object.keys(SCHEMAS).map(table => db[table].dump()))
    const payload = dumps.reduce((acc, dump) => {
      switch (dump.name) {
        case 'stars':
          return {
            ...acc,
            [dump.name]: {
              ...dump,
              docs: dump.docs
                .map(doc => Object.keys(doc).reduce((acc, key) => ({
                  ...acc,
                  ...(Object.keys(SCHEMAS[dump.name].properties).includes(key) ? { [key]: doc[key] } : {}),
                  credits: []
                }), {}))
            },
          }
        default:
          return {
            ...acc,
            [dump.name]: {
              ...dump,
              docs: dump.docs
                .map(doc => Object.keys(doc).reduce((acc, key) => ({
                  ...acc,
                  ...(Object.keys(SCHEMAS[dump.name].properties).includes(key) ? { [key]: doc[key] } : {})
                }), {}))
            },
          }
      }
    }, {})

    const now = new Date()
    const filename = `sensorr-dump-${[
      now.getFullYear().toString().padStart(2, 0),
      (now.getMonth() + 1).toString().padStart(2, 0),
      now.getDate().toString().padStart(2, 0),
    ].join('-')}.json`

    download(filename, JSON.stringify(payload, null, 2), 'application/json')
    this.setState({ total: Object.keys(payload).reduce((acc, key) => acc + payload[key].docs.length, 0), loading: false })
  }

  async handleImport(e) {
    e.persist()
    this.setState({ job: 'import', total: 0, loading: true })
    const db = await database.get()
    const file = e.target.files[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      const json = JSON.parse(text)
      Promise.all(Object.keys(typeof json === 'object' ? json : {})
        .filter(table => Object.keys(SCHEMAS).includes(table))
        .reduce((acc, table) => [...acc, ...json[table].docs.map(doc => db[table].atomicUpsert(doc))], [])
      ).then(results => {
        console.log(results)
        this.setState({ total: results.length, loading: false })
      })
    }
    reader.readAsText(file)
  }

  render() {
    const { ...props } = this.props
    const { job, loading, total, ...state } = this.state

    return (
      <div style={styles.section}>
        <h1 style={styles.title}>Database</h1>
        <p style={styles.paragraph}>
          Want to work with <em>your data</em> ? Habit of <em>backup everything</em> ? You can now dump and import your whole <strong>database</strong> ({Object.keys(SCHEMAS).join(', ')}) in JSON format !
          <br/>
          <br/>
        </p>
        <div style={styles.column}>
          <button
            type="button"
            style={{
              ...styles.button,
              flex: 1,
              margin: '0 10px 0 0',
              cursor: loading ? 'default' : 'pointer',
            }}
            onClick={loading ? () => {} : this.handleDump}
          >
            <span>{loading ? '⌛' : '💾'}</span>
            <span>&nbsp;&nbsp;&nbsp;</span>
            <span>{loading ? 'Loading' : 'Dump'}</span>
          </button>
          <button
            type="button"
            style={{
              ...styles.button,
              flex: 1,
              margin: '0 0 0 10px',
              backgroundColor: theme.colors.secondary,
              cursor: loading ? 'default' : 'pointer',
            }}
            onClick={loading ? () => {} : () => this.references.import.current.click()}
          >
            <input type="file" ref={this.references.import} onChange={this.handleImport} hidden={true} />
            <span>{loading ? '⌛' : '📡️'}</span>
            <span>&nbsp;&nbsp;&nbsp;</span>
            <span>{loading ? 'Loading' : 'Import'}</span>
          </button>
        </div>
        {!loading && ['dump', 'import'].includes(job) && ({
          dump: (
            <p style={{ margin: '1em 0 0 1em', textAlign: 'center' }}><strong>{total}</strong> documents dumped to JSON file ! 💾</p>
          ),
          import: (
            <p style={{ margin: '1em 0 0 1em', textAlign: 'center' }}><strong>{total}</strong> documents imported from JSON file ! 📡️</p>
          ),
        }[job])}
      </div>
    )
  }
}

export default Database
