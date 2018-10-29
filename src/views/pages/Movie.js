import React, { PureComponent } from 'react'
import Row from 'components/Row'
import Empty from 'components/Empty'
import Spinner from 'components/Spinner'
import TMDB from 'store/services/tmdb'
import XZNAB from 'store/services/xznab'
import filesize from 'filesize'
import database from 'store/database'
import theme from 'theme'

const xznab = new XZNAB({
  base: '',
  key: ''
})

const styles = {
  element: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  loading: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entity: {
    position: 'relative',
    overflow: 'hidden',
    flex: 1,
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    boxShadow: `inset 0 0 0 100em ${theme.colors.shadows.black}`,
  },
  metadata: {
    position: 'absolute',
    right: '2em',
    top: '2em',
    textAlign: 'right',
  },
  popularity: {
    fontFamily: theme.fonts.secondary,
    fontSize: '2em',
    fontWeight: 800,
    color: theme.colors.white,
  },
  runtime: {
    fontFamily: theme.fonts.secondary,
    fontSize: '1em',
    fontWeight: 600,
    color: theme.colors.white,
    padding: '1em 0',
  },
  badges: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'end',
  },
  badge: {
    cursor: 'pointer',
    backgroundColor: theme.colors.shadows.grey,
    borderRadius: '5em',
    padding: '1em',
    margin: '0.5em 0',
    fontWeight: 800,
    color: theme.colors.white,
    textTransform: 'uppercase'
  },
  emoji: {
    margin: '0 0.75em 0 0',
  },
  informations: {
    display: 'flex',
    padding: '5em 13em 2em 3em',
  },
  poster: {
    maxWidth: '15em',
    margin: '0 3em'
  },
  title: {
    fontSize: '4em',
    fontWeight: 800,
    color: theme.colors.white,
    padding: '0 0 0.25em',
  },
  subtitle: {
    fontSize: '1.5em',
    fontWeight: 600,
    color: theme.colors.white,
  },
  tagline: {
    color: theme.colors.white,
    fontWeight: 600,
    padding: '2em 0 0 0',
  },
  plot: {
    maxWidth: '50em',
    lineHeight: '1.5em',
    color: theme.colors.white,
    padding: '1em 1em 1em 0',
  },
  genres: {
    fontWeight: 600,
    color: theme.colors.white,
  },
  similar: {
    width: '100%',
    overflow: 'auto',
    fontSize: '0.75em',
  },
  results: {

  },
  table: {
    width: '100%',
  },
  thead: {
    position: 'sticky',
    top: '-1px',
    backgroundColor: theme.colors.primary,
    color: theme.colors.white,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  th: {
    padding: '1em',
  },
  input: {
    width: '100%',
    backgroundColor: theme.colors.grey,
    border: 'none',
    padding: 0,
    margin: 0,
    fontSize: '1.25em',
    padding: '0.75em 1em',
    textAlign: 'center',
    color: theme.colors.secondary,
    fontFamily: 'inherit',
  },
  query: {
    backgroundColor: theme.colors.grey,
    color: theme.colors.secondary,
    fontWeight: 800,
    textTransform: 'uppercase',
    padding: '1em',
  },
  td: {
    verticalAlign: 'middle',
    fontFamily: theme.fonts.secondary,
    padding: '1em',
    textAlign: 'center',
    borderBottom: `1px solid ${theme.colors.grey}`
  },
  grab: {
    cursor: 'pointer',
    fontSize: '2em',
    textDecoration: 'none',
  },
}

export default class Movie extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      doc: null,
      entity: null,
      similar: [],
      results: [],
      looking: false,
      sorting: 'Title',
      reverse: false,
      unpinned: true,
      query: '1080p|720p, TRUEFRENCH|FRENCH|MULTi',
    }

    this.filter = (a) => this.state.query.split(', ').length === this.state.query.split(', ')
      .map(query => new RegExp(`(${query})`, 'i').test(a.Title))
      .reduce((total, current) => total += current, 0)

    this.sort = (a, b) => {
      if (this.state.reverse) {
        if (a[this.state.sorting] < b[this.state.sorting]) return 1;
        if (a[this.state.sorting] > b[this.state.sorting]) return -1;
      } else {
        if (a[this.state.sorting] < b[this.state.sorting]) return -1;
        if (a[this.state.sorting] > b[this.state.sorting]) return 1;
      }
      return 0;
    }

    this.look = this.look.bind(this)
    this.handleStateChange = this.handleStateChange.bind(this)
    this.handleSortChange = this.handleSortChange.bind(this)
    this.handleQueryChange = this.handleQueryChange.bind(this)
  }

  async componentDidMount() {
    document.getElementById('movie').scrollIntoView()

    try {
      const entity = await TMDB.fetch(['movie', this.props.match.params.id])

      this.setState({ entity })

      const db = await database.get()
      const doc = await db.movies.findOne().where('id').eq(entity.id.toString()).exec()
      this.setState({ doc: doc.toJSON() })
    } catch(e) {}
  }

  async componentDidUpdate(props) {
    if (this.props.match.params.id !== props.match.params.id) {
      try {
        const entity = await TMDB.fetch(['movie', this.props.match.params.id])

        this.setState({ entity, unpinned: true })

        const db = await database.get()
        const doc = await db.movies.findOne().where('id').eq(this.props.match.params.id.toString()).exec()
        this.setState({ doc: doc ? doc.toJSON() : null })
      } catch(e) {}
    }
  }

  async handleStateChange() {
    const db = await database.get()

    if (!this.state.doc) {
      const doc = await db.movies.atomicUpsert({
        id: this.state.entity.id.toString(),
        title: this.state.entity.title,
        original_title: this.state.entity.original_title,
        poster_path: this.state.entity.poster_path,
        state: 'wished',
      })

      this.setState({ doc: doc.toJSON() })
    } else if (this.state.doc.state === 'wished') {
      const doc = await db.movies.atomicUpsert({
        id: this.state.entity.id.toString(),
        title: this.state.entity.title,
        original_title: this.state.entity.original_title,
        poster_path: this.state.entity.poster_path,
        state: 'archived',
      })

      this.setState({ doc: doc.toJSON() })
    } else if (this.state.doc.state === 'archived') {
      await db.movies.findOne().where('id').eq(this.state.entity.id.toString()).remove()
      this.setState({ doc: null })
    }
  }

  handleQueryChange(e) {
    this.setState({ query: e.target.value, })
  }

  handleSortChange(sorting) {
    this.setState({
      sorting,
      reverse: sorting === this.state.sorting ? !this.state.reverse : this.state.reverse,
    })
  }

  look() {
    const { entity } = this.state
    this.setState({ results: [], unpinned: false, loading: true, })

    setTimeout(() => document.getElementById('results').scrollIntoView(), 200)

    xznab.search(entity.title)
      .then(localized => {
        setTimeout(() => document.getElementById('results').scrollIntoView(), 500)

        if (entity.title !== entity.original_title) {
          return xznab.search(entity.original_title)
            .then(original => this.setState({
              results: [
                ...localized.Items,
                ...original.Items.filter(item => !localized.Items.map(x => x.Title).includes(item.Title)),
              ],
              loading: false,
            }))
        } else {
          this.setState({
            results: [
              ...localized.Items,
            ],
            loading: false,
          })
        }
      })
  }

  render() {
    const { doc, entity, loading, unpinned, sorting, results, query, ...state } = this.state

    return (
      <div id="movie" style={styles.element}>
        {entity ? [
          <div key="entity" style={{ ...styles.entity, backgroundImage: `url(http://image.tmdb.org/t/p/original${entity.backdrop_path})` }}>
            <div style={styles.metadata}>
              <h3 style={styles.popularity}>{entity.vote_average} {entity.vote_average < 5 ? '👎' : entity.vote_average < 8 ? '👍' : '🙏'}</h3>
              <h4 style={styles.runtime}>{entity.runtime} mins 🕙</h4>
              <div style={styles.badges}>
                {!doc && (
                  <div style={styles.badge} onClick={this.handleStateChange}>
                    <span style={styles.emoji}>🔕</span>
                    Ignored
                  </div>
                )}
                {doc && doc.state === 'wished' && (
                  <div style={styles.badge} onClick={this.handleStateChange}>
                    <span style={styles.emoji}>🍿</span>
                    Wished
                  </div>
                )}
                {doc && doc.state === 'archived' && (
                  <div style={styles.badge} onClick={this.handleStateChange}>
                    <span style={styles.emoji}>📼</span>
                    Archived
                  </div>
                )}
                <div style={styles.badge} onClick={this.look}>
                  <span style={styles.emoji}>🔍</span>
                  Look
                </div>
              </div>
            </div>
            <div style={styles.informations}>
              <div>
                <img src={`http://image.tmdb.org/t/p/original${entity.poster_path}`} style={styles.poster} />
              </div>
              <div>
                <h1 style={styles.title}>{entity.title}</h1>
                <h2 style={styles.subtitle}>
                  {entity.title !== entity.original_title && (
                    <span style={{ margin: '0 0.5em 0 0' }}>{entity.original_title}</span>
                  )}
                  <span>({new Date(entity.release_date).getFullYear()})</span>
                </h2>
                {!!entity.tagline && (
                  <h3 style={styles.tagline}>{entity.tagline}</h3>
                )}
                <p style={styles.plot}>{entity.overview}</p>
                <p style={styles.genres}>{entity.genres.map(genre => genre.name).join(', ')}</p>
              </div>
            </div>
            <div style={styles.similar}>
              <Row uri={['movie', this.props.match.params.id, 'similar']} />
            </div>
          </div>,
          <div key="results" id="results" style={styles.results} hidden={unpinned}>
            <table style={styles.table}>
              <thead style={styles.thead}>
                <tr>
                  <th style={{ ...styles.th, cursor: 'pointer', }} onClick={() => this.handleSortChange('Title')}>Title</th>
                  <th style={{ ...styles.th, cursor: 'pointer', }} onClick={() => this.handleSortChange('Site')}>Source</th>
                  <th style={{ ...styles.th, cursor: 'pointer', }} onClick={() => this.handleSortChange('Peers')}>Peers</th>
                  <th style={{ ...styles.th, cursor: 'pointer', }} onClick={() => this.handleSortChange('Seeders')}>Seeders</th>
                  <th style={{ ...styles.th, cursor: 'pointer', }} onClick={() => this.handleSortChange('Size')}>Size</th>
                  <th style={styles.th}>Grab</th>
                </tr>
                <tr>
                  <td colSpan={6}>
                    <input
                      type="text"
                      defaultValue={query}
                      onKeyUp={this.handleQueryChange}
                      style={styles.input}
                      placeholder="Filter..."
                    />
                  </td>
                </tr>
              </thead>
              <tbody>
                {!loading && !results.filter(this.filter).length ? (
                  <tr>
                    <td colSpan={6}>
                      <Empty />
                    </td>
                  </tr>
                ) : (
                  results.filter(this.filter).sort(this.sort).map((release, index) => (
                    <tr key={index} style={styles.tr}>
                      <td style={{ ...styles.td, textAlign: 'left', }}>{release.Title}</td>
                      <td style={styles.td}>{release.Site}</td>
                      <td style={styles.td}>{release.Peers}</td>
                      <td style={styles.td}>{release.Seeders}</td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>{filesize(release.Size)}</td>
                      <td style={{ ...styles.td, padding: 0 }}>
                        <a href={release.Link} style={styles.grab} target="_blank">🎟</a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {loading && (
              <div style={styles.loading}>
                <Spinner />
              </div>
            )}
          </div>
        ] : (
          <div style={styles.loading}>
            <Spinner />
          </div>
        )}
      </div>
    )
  }
}
