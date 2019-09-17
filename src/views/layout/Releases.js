import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { withToastManager } from 'react-toast-notifications'
import { Movie } from 'shared/Documents'
import AnimateHeight from 'react-animate-height'
import CountUp from 'react-countup'
import Controls from 'components/Layout/Controls'
import Spinner from 'components/Spinner'
import Empty from 'components/Empty'
import sensorr from 'store/sensorr'
import database from 'store/database'
import filesize from 'shared/utils/filesize'
import { clean } from 'shared/utils/string'
import nanobounce from 'nanobounce'
import theme from 'theme'

const styles = {
  releases: {
    element: {

    },
    ongoing: {
      '>div': {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '2em 10%',
        backgroundColor: theme.colors.tertiary,
        color: 'white',
        '>div:first-of-type': {
          'display': 'flex',
          alignItems: 'center',
          '>div:first-of-type': {
            height: '1em',
            width: '1em',
            margin: '0 1em 0 -2em',
          },
        },
        '>div:last-of-type': {

        },
      },
    },
    results: {
      margin: '2em 0',
    },
    spinner: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '50vh',
      margin: '2em 0 0 0',
    },
  },
  release: {
    element: {
      position: 'relative',
      fontSize: '0.75em',
      padding: '0 2em 0 1em',
      overflow: 'hidden',
      '>div': {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1em 0',
        backgroundColor: 'transparent',
        borderBottom: `0.075em solid ${theme.colors.mercury}`,
        '>a': {
          ...theme.resets.a,
          zIndex: 1,
          position: 'absolute',
          fontSize: '2em',
          margin: '0 0 0 -3em',
          transition: 'margin ease 250ms',
        },
        '>div:first-of-type': {
          '>button': {
            ...theme.resets.button,
            margin: '0 0 0 4em',
            opacity: 0.8,
          },
          '>a': {
            zIndex: 1,
            color: theme.colors.primary,
            opacity: 0.8,
            ':hover': {
              opacity: 1,
            },
          },
        },
        '>div:last-of-type': {
          display: 'flex',
          alignItems: 'center',
          '>span': {
            fontSize: '2em',
            margin: '0 1em 0 0',
          },
        },
      },
      ':hover': {
        '>div': {
          backgroundColor: 'white',
          '>a': {
            margin: '0 0 0 0.5em',
            transition: 'margin ease 250ms 250ms',
          },
          '>div>button': {
            opacity: 1,
          },
        },
      },
    },
    invalid: {
      textDecoration: 'line-through',
    },
    bars: {
      display: 'flex',
      flexDirection: 'column',
      '>div': {
        display: 'flex',
        alignItems: 'center',
        '>span:nth-of-type(2)': {
          display: 'block',
          height: '0.125em',
          width: '8em',
          margin: '0 1em',
        },
        '>small': {
          width: '6em',
        },
      },
    },
  },
}

class Releases extends PureComponent {
  static propTypes = {
    movie: PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props)

    this.state = {
      releases: [],
      loading: true,
      ongoing: {
        title: null,
        xznab: null,
      },
      filter: () => true,
      sort: (a, b) => Releases.Sortings.score.apply(a, b, true),
    }

    this.releases = {}
    this.debounce = nanobounce(200)
  }

  componentDidMount() {
    this.subscription = sensorr.look(
      new Movie(this.props.movie, global.config.region || localStorage.getItem('region')).normalize(),
      false,
      {
        search: (xznab, title) => {
          console.log('🔫 ', `Looking for "${title}" on "${xznab.name}" XZNAB`)
          this.setState({ ongoing: { xznab, title }})
        },
        timeout: (xznab, title) => {
          console.log('⌛ ', `Request for "${title}" on "${xznab.name}" XZNAB timed out ! Retrying...`)
        },
        found: (xznab, title, items) => {
          console.log('🎞️ ', `Found "${items.length}" releases`)
        },
        release: (xznab, title, release) => {
          console.log('*', release.title, release.valid ? `(${release.score})` : release.reason)
          this.releases[release.guid] = release
          this.debounce(() => this.setState({ releases: Object.values(this.releases) }))
        },
        sorted: (releases) => {
          if (releases.length) {
            console.log('🚧', `Filtering and ordering "${releases.length}" releases`, `[${this.state.sort}]`, { true: '🔻', false: '🔺' }[this.state.descending])
          } else {
            console.log('📭', `️Sorry, no valid releases found`)
          }
        },
      },
    )
    .subscribe(
      () => {},
      (err) => {
        this.setState({ loading: false, ongoing: { title: null, xznab: null } })
        console.warn(err)
      },
      () => {
        this.setState({ loading: false, ongoing: { title: null, xznab: null } })
      }
    )
  }

  componentWillUnmount() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
  }

  handleGrabClick(release) {
    const { toastManager } = this.props

    toastManager.add((
      <span>Trying to grab release <strong>{release.title}</strong>...</span>
    ), { appearance: 'info', autoDismiss: true, })

    fetch('/api/grab', {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Basic ${new Buffer(`${sensorr.config.auth.username}:${sensorr.config.auth.password}`).toString('base64')}`,
      }),
      body: JSON.stringify({ release }),
    })
    .then(res => {
      try {
        res.json().then(body => {
          if (res.ok) {
            toastManager.add((
              <span>Release <strong>{release.title}</strong> grabbed to <strong>{sensorr.config.blackhole}</strong></span>
            ), { appearance: 'success', autoDismiss: true, })

            database.get().then(db => db.movies.atomicUpsert(new Movie({
              ...this.props.movie,
              state: 'archived'
            }, global.config.region || localStorage.getItem('region')).normalize()))
          } else {
            toastManager.add((
              <span>Something went wrong during <strong>{release.title}</strong> grabing : <strong>{body.reason}</strong></span>
            ), { appearance: 'error', autoDismiss: true, })
          }
        })
      } catch(e) {
        toastManager.add((
          <span>Unexpected error during <strong>{release.title}</strong> grabing : <strong>{res.statusText}</strong></span>
        ), { appearance: 'error', autoDismiss: true, })
      }
    })
  }

  render() {
    const { ...props } = this.props
    const { releases, loading, ongoing, filter, sort, ...state } = this.state

    const movie = new Movie(props.movie, global.config.region || localStorage.getItem('region')).normalize()
    const filtered = releases.filter(filter).sort(sort)

    const highests = {
      score: ([...releases].sort((a, b) => a.score - b.score).pop() || { score: 0 }).score,
      peers: ([...releases].sort((a, b) => a.peers - b.peers).pop() || { peers: 0 }).peers,
      size: ([...releases].sort((a, b) => a.size - b.size).pop() || { size: 0 }).size,
    }

    return (
      <div css={styles.releases.element}>
        <Controls
          entities={releases}
          label={({ total, reset }) => (
            <button css={theme.resets.button} onClick={() => reset()}>
              <span><strong>{total}</strong> Releases</span>
            </button>
          )}
          filters={Object.keys(Releases.Filters).reduce((acc, key) => ({ ...acc, [key]: Releases.Filters[key](releases, movie) }), {})}
          sortings={Releases.Sortings}
          onChange={({ filter, sort }) => this.setState({ filter, sort })}
          defaults={{
            filtering: {},
            sorting: Releases.Sortings.score,
            reverse: false,
          }}
          render={{
            filters: (Blocks) => (
              <>
                <div css={[theme.styles.row, theme.styles.spacings.row]}>
                  <Blocks.languages display="column" />
                  <Blocks.sources display="column" />
                  <Blocks.resolutions display="column" />
                  <Blocks.encodings display="column" />
                  <Blocks.dubs display="column" />
                </div>
                <Blocks.flags />
                <div css={[theme.styles.row, theme.styles.spacings.row]}>
                  <Blocks.score />
                  <Blocks.peers />
                  <Blocks.size />
                </div>
                <div css={[theme.styles.row, theme.styles.spacings.row]}>
                  <Blocks.terms display="column" />
                  <Blocks.websites display="column" />
                  <Blocks.state display="column" />
                </div>
              </>
            )
          }}
        />
        <AnimateHeight css={styles.releases.ongoing} height={ongoing.title && ongoing.xznab ? 'auto' : 0}>
          <div>
            <Spinner />
            <code>{ongoing.title}</code>
            <code>&nbsp;</code>
            <code><small css={theme.styles.semitransparent}>{(ongoing.xznab || {}).name}</small></code>
          </div>
          <div>
            {ongoing.title && ongoing.xznab && (
              <code>
                <CountUp
                  start={0}
                  duration={10}
                  suffix="%"
                  easingFn={(t, b, c, d) => (t == d) ? b + c : c * (-Math.pow(2, -10 * t/d) + 1) + b} // easeOutExpo
                  start={parseInt(100 * (
                    ((movie.terms.titles.indexOf(ongoing.title) * sensorr.xznabs.length) + sensorr.xznabs.indexOf(ongoing.xznab)) /
                    (movie.terms.titles.length * sensorr.xznabs.length)
                  ))}
                  end={parseInt(100 * (
                    ((movie.terms.titles.indexOf(ongoing.title) * sensorr.xznabs.length) + sensorr.xznabs.indexOf(ongoing.xznab) + 1) /
                    (movie.terms.titles.length * sensorr.xznabs.length)
                  ))}
                />
              </code>
            )}
          </div>
        </AnimateHeight>
        <div css={styles.releases.results}>
          {filtered.map(release => {
            const link = new URL(release.link)
            link.searchParams.set('file', release.meta.generated.normalize('NFD').replace(/[^\x00-\x7F]/g, ''))

            return (
              <div
                key={release.guid}
                css={styles.release.element}
                {...release.warning ? {
                  title: release.reason,
                } : {}}
              >
                <div>
                  <a
                    href={`/proxy?url=${window.btoa(link.toString())}`}
                    target="_blank"
                    title="🍿 Grab a ticket (manual)"
                  >
                    🎟
                  ️</a>
                  <div>
                    <button
                      onClick={() => this.handleGrabClick(release)}
                      title="🍿 Grab a ticket (auto)"
                    >
                      <code css={[release.warning === 2 && styles.release.invalid]}>
                        {release.meta.generated}
                      </code>
                    </button>
                    <span>&nbsp;&nbsp;</span>
                    <a href={release.guid}>
                      <code><small>({release.site})</small></code>
                    </a>
                  </div>
                  <div>
                    {release.warning === 0 && (
                      <span title="🎉 Release is valid according to configured policy">👍</span>
                    )}
                    <div css={styles.release.bars}>
                      <div title={`Score (${release.score})`}>
                        <span>💯</span>
                        <span
                          style={{
                            background: `linear-gradient(
                              90deg,
                              ${theme.colors.primary} 0%,
                              ${theme.colors.primary} ${(release.score / highests.score) * 100}%,
                              ${theme.colors.mercury} ${(release.score / highests.score) * 100}%,
                              ${theme.colors.mercury} 100%
                            )`,
                          }}
                        />
                        <small css={theme.styles.semitransparent}><code>{release.score}</code></small>
                      </div>
                      <div title={`Peers (${release.seeders}/${release.peers})`}>
                        <span>🌍</span>
                        <span
                          style={{
                            background: `linear-gradient(
                              90deg,
                              ${theme.colors.primary} 0%,
                              ${theme.colors.primary} ${(release.peers / highests.peers) * 100}%,
                              ${theme.colors.mercury} ${(release.peers / highests.peers) * 100}%,
                              ${theme.colors.mercury} 100%
                            )`,
                          }}
                        />
                        <small css={theme.styles.semitransparent}><code>{release.peers}</code></small>
                      </div>
                      <div title={`Size (${filesize.stringify(release.size)})`}>
                        <span>📦</span>
                        <span
                          style={{
                            background: `linear-gradient(
                              90deg,
                              ${theme.colors.primary} 0%,
                              ${theme.colors.primary} ${(release.size / highests.size) * 100}%,
                              ${theme.colors.mercury} ${(release.size / highests.size) * 100}%,
                              ${theme.colors.mercury} 100%
                            )`,
                          }}
                        />
                        <small css={theme.styles.semitransparent}><code>{filesize.stringify(release.size)}</code></small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          {!filtered.length && (loading ? (
            <div css={styles.releases.spinner}>
              <Spinner />
            </div>
          ) : (
            <Empty
              emoji="💀"
              title="Sorry, no releases found"
              subtitle={(
                <span>
                  Try to add some XZNAB to your configuration ?
                </span>
              )}
            />
          ))}
        </div>
      </div>
    )
  }
}

Releases.Filters = {
  query: (entities) => ({
    label: 'Query',
    type: 'input',
    default: '',
    apply: (entity, value) => [entity.title].some(string => new RegExp(clean(value), 'i').test(clean(string))),
  }),
  sources: (entities) => {
    const sources = entities.filter(entity => entity.meta.source).reduce((acc, curr) => ({ ...acc, [curr.meta.source]: 0 }), {})

    return {
      label: 'Source',
      type: 'checkbox',
      inputs: Object.keys(sources).map(source => ({
        label: source,
        value: source,
      })),
      default: [],
      orderize: true,
      apply: (entity, values) => !values.length || values.some(source => entity.meta.source === source),
      histogram: (entities) => entities.reduce((histogram, entity) => ({
        ...histogram,
        [entity.meta.source || '']: (histogram[entity.meta.source] || 0) + 1,
      }), sources),
    }
  },
  encodings: (entities) => {
    const encodings = entities.filter(entity => entity.meta.encoding).reduce((acc, curr) => ({ ...acc, [curr.meta.encoding]: 0 }), {})

    return {
      label: 'Encoding',
      type: 'checkbox',
      inputs: Object.keys(encodings).map(encoding => ({
        label: encoding,
        value: encoding,
      })),
      default: [],
      orderize: true,
      apply: (entity, values) => !values.length || values.some(encoding => entity.meta.encoding === encoding),
      histogram: (entities) => entities.reduce((histogram, entity) => ({
        ...histogram,
        [entity.meta.encoding || '']: (histogram[entity.meta.encoding] || 0) + 1,
      }), encodings),
    }
  },
  resolutions: (entities) => {
    const resolutions = entities.filter(entity => entity.meta.resolution).reduce((acc, curr) => ({ ...acc, [curr.meta.resolution]: 0 }), {})

    return {
      label: 'Resolution',
      type: 'checkbox',
      inputs: Object.keys(resolutions).map(resolution => ({
        label: resolution,
        value: resolution,
      })),
      default: [],
      orderize: true,
      apply: (entity, values) => !values.length || values.some(resolution => entity.meta.resolution === resolution),
      histogram: (entities) => entities.reduce((histogram, entity) => ({
        ...histogram,
        [entity.meta.resolution || '']: (histogram[entity.meta.resolution] || 0) + 1,
      }), resolutions),
    }
  },
  dubs: (entities) => {
    const dubs = entities.filter(entity => entity.meta.dub).reduce((acc, curr) => ({ ...acc, [curr.meta.dub]: 0 }), {})

    return {
      label: 'Dub',
      type: 'checkbox',
      inputs: Object.keys(dubs).map(dub => ({
        label: dub,
        value: dub,
      })),
      default: [],
      orderize: true,
      apply: (entity, values) => !values.length || values.some(dub => entity.meta.dub === dub),
      histogram: (entities) => entities.reduce((histogram, entity) => ({
        ...histogram,
        [entity.meta.dub || '']: (histogram[entity.meta.dub] || 0) + 1,
      }), dubs),
    }
  },
  languages: (entities) => {
    const languages = entities.reduce((acc, curr) => ({ ...acc, [curr.meta.language]: 0 }), {})

    return {
      label: 'Language',
      type: 'checkbox',
      inputs: Object.keys(languages).map(language => ({
        label: language,
        value: language,
      })),
      default: [],
      orderize: true,
      apply: (entity, values) => !values.length || values.some(language => entity.meta.language === language),
      histogram: (entities) => entities.reduce((histogram, entity) => ({
        ...histogram,
        [entity.meta.language || '']: (histogram[entity.meta.language] || 0) + 1,
      }), languages),
    }
  },
  flags: (entities) => {
    const flags = entities
      .reduce((acc, curr) => [...new Set([...acc, ...(curr.meta.flags || [])])], [])
      .reduce((acc, curr) => ({ ...acc, [curr]: 0 }), {})

    return {
      label: 'Flags',
      type: 'checkbox',
      inputs: Object.keys(flags).map(flag => ({
        label: flag,
        value: flag,
      })),
      default: [],
      orderize: true,
      apply: (entity, values) => !values.length || values.some(flag => (entity.meta.flags || []).includes(flag)),
      histogram: (entities) => entities.reduce((histogram, entity) => ({
        ...histogram,
        ...((entity.meta.flags || []).reduce((acc, curr) => ({
          ...acc,
          [curr]: (histogram[curr] || 0) + 1,
        }), {})),
      }), flags),
    }
  },
  terms: (entities, movie) => ({
    label: 'Term',
    type: 'checkbox',
    inputs: movie.terms.titles.map(title => ({
      label: title,
      value: title,
    })),
    default: [],
    orderize: true,
    apply: (entity, values) => !values.length || values.some(source => entity.term === source),
    histogram: (entities) => entities.reduce((histogram, entity) => ({
      ...histogram,
      [entity.term || '']: (histogram[entity.term] || 0) + 1,
    }), movie.terms.titles.reduce((acc, curr) => ({ ...acc, [curr]: 0 }), {})),
  }),
  websites: (entities) => {
    const websites = entities.reduce((acc, entity) => ({ ...acc, [entity.site || '']: 0 }), {})

    return {
      label: 'Website',
      type: 'checkbox',
      inputs: Object.keys(websites).map(website => ({
        label: website,
        value: website,
      })),
      default: [],
      orderize: true,
      apply: (entity, values) => !values.length || values.some(website => entity.site === website),
      histogram: (entities) => entities.reduce((histogram, entity) => ({
        ...histogram,
        [entity.site || '']: (histogram[entity.site] || 0) + 1,
      }), websites),
    }
  },
  state: (entities) => {
    const states = { valid: 0, filtered: 0, invalid: 0 }
    const compute = (entity) => Object.keys(states)[entity.warning]

    return {
      label: 'State',
      type: 'checkbox',
      inputs: Object.keys(states).map(state => ({
        label: `${{ valid: '👍', filtered: '👮', invalid: '🚫' }[state]}  ${state.charAt(0).toUpperCase()}${state.slice(1)}`,
        value: state,
      })),
      default: [],
      apply: (entity, values) => !values.length || values.some(state => compute(entity) === state),
      histogram: (entities) => entities.reduce((histogram, entity) => ({
        ...histogram,
        [compute(entity)]: (histogram[compute(entity)] || 0) + 1,
      }), { valid: 0, invalid: 0, filtered: 0 }),
    }
  },
  peers: (entities) => {
    const compute = (peers = 0) => Math.max(0, parseInt(peers / 10) * 10)
    const step = 10
    const min = 0
    const max = step + entities.reduce((peers, entity) => entity.peers > peers ? entity.peers : peers, 10)

    return {
      label: 'Peers',
      type: 'range',
      default: [min, max],
      min: min,
      max: max,
      step: step,
      apply: (entity, values) => compute(entity.peers) >= values[0] && compute(entity.peers) < values[1],
      histogram: (entities) => entities.reduce((histogram, entity) => ({
        ...histogram,
        [compute(entity.peers)]: (histogram[compute(entity.peers)] || 0) + 1,
      }), Array(Math.floor((max - min) / 10)).fill(true).reduce((acc, curr, index) => ({ ...acc, [index * 10]: 0 }), {})),
    }
  },
  score: (entities) => {
    const compute = (entity) => Math.max(0, parseInt(entity.score / 100) * 100)
    const step = 100
    const min = 0
    const max = step + entities.reduce((score, entity) => compute(entity) > score ? compute(entity) : score, 1)

    return {
      label: 'Score',
      type: 'range',
      default: [min, max],
      min: min,
      max: max,
      step: step,
      apply: (entity, values) => compute(entity) >= values[0] && compute(entity) < values[1],
      histogram: (entities) => entities.reduce((histogram, entity) => ({
        ...histogram,
        [compute(entity)]: (histogram[compute(entity)] || 0) + 1,
      }), Array(Math.floor((max - min) / 100)).fill(true).reduce((acc, curr, index) => ({ ...acc, [index * 100]: 0 }), {})),
    }
  },
  size: (entities) => {
    const compute = (entity) => Math.max(0, parseInt(entity.size / Math.pow(1024, 3)))
    const step = 1
    const min = 0
    const max = step + entities.reduce((size, entity) => compute(entity) > size ? compute(entity) : size, 1)

    return {
      label: 'Size',
      type: 'range',
      default: [min, max],
      min: min,
      max: max,
      step: step,
      unit: 'GB',
      apply: (entity, values) => compute(entity) >= parseInt(values[0]) && compute(entity) < parseInt(values[1]),
      histogram: (entities) => entities.reduce((histogram, entity) => ({
        ...histogram,
        [`${compute(entity)} GB`]: (histogram[`${compute(entity)} GB`] || 0) + 1,
      }), Array(max - min).fill(true).reduce((acc, curr, index) => ({ ...acc, [`${min + index} GB`]: 0 }), {})),
    }
  },
}

Releases.Sortings = {
  score: {
    value: 'score',
    label: '💯  Score',
    apply: (a, b, reverse) => {
      const score = (parseInt((reverse ? a : b).score) || 0) - (parseInt((reverse ? b : a).score) || 0)
      const peers = (parseInt((reverse ? a : b).peers) || 0) - (parseInt((reverse ? b : a).peers) || 0)

      if (score === 0) {
        return peers
      } else {
        return score
      }
    },
  },
  peers: {
    value: 'peers',
    label: '🌍  Peers',
    apply: (a, b, reverse) => (parseInt((reverse ? a : b).peers) || 0) - (parseInt((reverse ? b : a).peers) || 0),
  },
  size: {
    value: 'size',
    label: '📦️  Size',
    apply: (a, b, reverse) => (parseInt((reverse ? a : b).size) || 0) - (parseInt((reverse ? b : a).size) || 0),
  },
}

export default withToastManager(Releases)
