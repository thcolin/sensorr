import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import toast from 'react-hot-toast'
import semver from 'semver'
import { Button, Link } from '@sensorr/ui'
import { emojize, useTitle } from '@sensorr/utils'
import { JOB_EMOJIS } from '@sensorr/sensorr'
import { animations } from '@sensorr/theme'
import Body from '../../layout/Body/Body'
import { useAPI } from '../../store/api'
import { useJobsContext } from '../../contexts/Jobs/Jobs'
import { JobSettings } from './Jobs'
import { errorOf } from './Mail'

const CHANNELS = {
  beta: { emoji: '🧪', tag: 'beta', source: <>Every <code>vX.Y.Z-beta.N</code> tag of <code>dev</code></> },
  stable: { emoji: '📦', tag: 'latest', source: <>Every <code>vX.Y.Z</code> tag of <code>main</code></> },
}

// Pulling the images and recreating three containers takes a minute or two
const PATIENCE = 5 * 60 * 1000

export const availableOf = (update) => {
  const version = update?.channels?.[update?.channel]?.version

  return (version && semver.valid(version) && semver.valid(update.version) && semver.gt(version, update.version)) ? version : null
}

const Failure = ({ title, cause, logs }: { title: string, cause?: string, logs?: string }) => (
  <div role='alert' sx={Update.styles.failure}>
    <strong>{emojize('🚨', title)}</strong>
    {cause && <span>{cause}</span>}
    {logs && <span>Logs: <strong sx={{ variant: 'code.reset' }}>docker logs {logs}</strong></span>}
  </div>
)

const Placeholder = ({ width }: { width: string }) => <span aria-hidden={true} sx={{ ...Update.styles.placeholder, width }} />

const durationOf = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`

const Update = ({ ...props }) => {
  useTitle('Settings - Update')
  const api = useAPI()
  const { update, loadUpdate } = useOutletContext() as any
  const { process } = useJobsContext() as any
  const [channel, setChannel] = useState(null)
  const [updating, setUpdating] = useState(null)
  const [failure, setFailure] = useState(null)
  const [now, setNow] = useState(Date.now())

  const loading = !update
  const updater = update?.updater
  const selected = channel || (update?.channel in CHANNELS ? update.channel : loading ? null : 'stable')
  const target = update?.channels?.[selected]?.version
  const current = selected === update?.channel
  const jobs = useMemo(() => Object.values(process || {}).map(({ command, type }: any) => [command, type].filter(Boolean).join(' ')), [process])
  const revision = update?.revision?.slice(0, 7)
  const pinned = update?.channel in CHANNELS && update.tag !== CHANNELS[update.channel].tag ? update.tag : null

  // Settings stays mounted across its pages: its answer may predate an update started here
  useEffect(() => {
    loadUpdate()
  }, [])

  // A run still going, or failed, outlives the page: a reload, or a visit elsewhere in Settings
  useEffect(() => {
    const run = updater?.run
    const key = Object.keys(CHANNELS).find((key) => CHANNELS[key].tag === run?.tag)
    const version = update?.channels?.[key]?.version

    if (!key || !version || version === update.version) {
      return
    }

    if (run.status === 'running') {
      setFailure(null)
      setUpdating({ version, since: Date.parse(run.started) })
    } else if (run.code !== 0) {
      setFailure({ title: `The last update, to v${version}, failed`, cause: `sensorr-updater-run exited (${run.code})`, logs: 'sensorr-updater-run' })
    }
  }, [update])

  useEffect(() => {
    if (!updating) {
      return
    }

    let timer

    const poll = async () => {
      setNow(Date.now())

      try {
        const { uri, params, init } = api.query.update.getUpdate()
        const raw = await api.fetch(uri, params, init)

        if (raw.version === updating.version) {
          return window.location.reload()
        }

        if (raw.updater?.run?.status === 'exited' && raw.updater.run.code !== 0) {
          setFailure({ title: `Update to v${updating.version} failed`, cause: `sensorr-updater-run exited (${raw.updater.run.code})`, logs: 'sensorr-updater-run' })
          return setUpdating(null)
        }
      } catch (err) {
        // sensorr-api and sensorr-web are being recreated
      }

      if (Date.now() - updating.since > PATIENCE) {
        setFailure({ title: `Update to v${updating.version} failed`, cause: `v${updating.version} still does not answer after ${PATIENCE / 60000} minutes`, logs: 'sensorr-updater-run' })
        return setUpdating(null)
      }

      timer = setTimeout(poll, 3000)
    }

    timer = setTimeout(poll, 3000)
    return () => clearTimeout(timer)
  }, [updating])

  const start = async () => {
    setFailure(null)

    try {
      const { uri, params, init } = api.query.update.postUpdate({ body: { channel: selected } })
      await api.fetch(uri, params, init, { rawError: true })
      setNow(Date.now())
      setUpdating({ version: target, since: Date.now() })
    } catch (err) {
      toast.error((await errorOf(err)) || `Error while updating to v${target}, try again`)
    }
  }

  const available = availableOf(update)
  const unreachable = !!update?.channels?.[update?.channel]?.error

  const sentence = (() => {
    if (updating) {
      return `Updating to v${updating.version}`
    }

    if (update?.channel === 'dev') {
      return <>Follows every push to <code>dev</code></>
    }

    if (!update?.channel) {
      return <>Follows no channel, <code>SENSORR_TAG</code> is not set</>
    }

    if (unreachable) {
      return `Can't reach GHCR, the latest ${update.channel} is unknown`
    }

    if (pinned) {
      return available ? <>SENSORR_TAG pins this version, <code>v{available}</code> is out on {update.channel}</> : `SENSORR_TAG pins this version, up to date on ${update.channel}`
    }

    return available ? <><code>v{available}</code> is out on {update.channel}</> : `Up to date on ${update.channel}`
  })()

  const state = (failure || updater?.error) ? 'error' : (updating || available || unreachable) ? 'warning' : (update?.channel === 'dev' || !update?.channel) ? 'grayDarker' : 'success'

  const reasonOf = (key) => {
    const { version, error } = update?.channels?.[key] || {}

    return version ? null : error ? `can't reach GHCR, ${error}` : 'no release yet'
  }

  const ready = !!updater && !updater.error
  const actionable = !!updating || (!!target && (!current || !!available))
  const disabled = !!updating || !!jobs.length

  const action = updating
    ? `⌛ Updating to v${updating.version}`
    : current
      ? `Update to v${target}${pinned ? ', replaces your pin' : ''}`
      : `Switch to ${selected}, v${target}${pinned ? ', replaces your pin' : ''}`

  const manual = (
    <>
      <p>Set <code>SENSORR_TAG={CHANNELS[selected || 'stable'].tag}</code> in the env file you pass to compose, then:</p>
      <code sx={Update.styles.commands}>
        docker compose --env-file &lt;env file&gt; pull sensorr-api sensorr-web<br />
        docker compose --env-file &lt;env file&gt; up -d sensorr-api sensorr-web
      </code>
      {!updater && (
        <p>
          <small>To update from this page instead, turn on the <code>updater</code> profile, see <a href='https://github.com/thcolin/sensorr#update-from-the-app' target='_blank' rel='noopener noreferrer'>Update from the app</a>.</small>
        </p>
      )}
    </>
  )

  const source = (key) => loading ? <small><Placeholder width='20em' /></small> : (
    <small>
      {CHANNELS[key].source}, {reasonOf(key) || <>latest <code>v{update.channels[key].version}</code></>}
    </small>
  )

  return (
    <Body>
      <section>
        <article>
          <h2>Update</h2>
          <div sx={Update.styles.stack}>
            {update?.error ? (
              <Failure title="Can't read the update status" cause={update.error} logs='sensorr-api' />
            ) : (
              <div sx={JobSettings.styles.container} aria-busy={loading}>
                <div sx={{ ...JobSettings.styles.metadata, flex: 1 }}>
                  <h5 aria-level={3} title={pinned ? 'SENSORR_TAG pins this version' : undefined}>
                    {loading ? <Placeholder width='9em' /> : pinned ? emojize('📍', `v${update.version}`) : CHANNELS[update.channel] ? emojize(CHANNELS[update.channel].emoji, `v${update.version}`) : `v${update.version}`}
                  </h5>
                  <p role='status' sx={Update.styles.state}>
                    <span>{loading ? <Placeholder width='12em' /> : sentence}</span>
                    {loading ? <small><Placeholder width='8em' /></small> : revision && <small title={update.revision}>revision <span sx={{ fontFamily: 'monospace' }}>{revision}</span></small>}
                  </p>
                </div>
                <span sx={Update.styles.dot}>
                  <i sx={{ backgroundColor: loading ? 'gray' : state }} />
                </span>
              </div>
            )}
            {update?.channel !== 'dev' && !update?.error && (
              <div sx={Update.styles.channel}>
                <div role='radiogroup' aria-label='Channel' sx={Update.styles.channels}>
                  <span aria-hidden={true}>channel</span>
                  {Object.entries(CHANNELS).map(([key, { emoji }]) => (
                    <label key={key} htmlFor={`update-${key}`} title={!loading && reasonOf(key) ? `${key}: ${reasonOf(key)}` : undefined}>
                      <input
                        type='radio'
                        id={`update-${key}`}
                        name='channel'
                        value={key}
                        checked={selected === key}
                        disabled={loading || !!updating || (key !== update.channel && !!reasonOf(key))}
                        onChange={() => setChannel(key)}
                      />
                      <span aria-hidden={true}>{emoji}</span>
                      <span data-name={true}>{key}</span>
                      {!loading && key === update.channel && <span data-current={true}>current</span>}
                      {!loading && reasonOf(key) && <span sx={Update.styles.hidden}>, {reasonOf(key)}</span>}
                    </label>
                  ))}
                </div>
                {source(selected)}
              </div>
            )}
            {update?.channel === 'dev' && (
              <p>
                Set <code>SENSORR_TAG</code> to <code>beta</code> or <code>latest</code> in the env file you pass to compose to follow a release.
              </p>
            )}
            {update?.channel !== 'dev' && ready && actionable && (
              <div sx={Update.styles.action}>
                <Button type='button' color='primary' sx={{ width: '100%' }} disabled={disabled} aria-busy={!!updating} onClick={start}>{action}</Button>
                {!updating && !!jobs.length ? (
                  <p sx={Update.styles.warning}>
                    <strong>Warning</strong>, {jobs.length > 2 ? `${emojize(JOB_EMOJIS[jobs[0]], jobs[0])} and ${jobs.length - 1} more` : jobs.map((job) => emojize(JOB_EMOJIS[job], job)).join(' and ')} {jobs.length > 1 ? 'are running, wait for them or stop them' : 'is running, wait for it or stop it'} in <Link to='/jobs'>Jobs</Link>
                  </p>
                ) : (
                  <small>
                    {updating ? (
                      <>The page reloads once v{updating.version} answers<span aria-hidden='true' sx={{ fontVariantNumeric: 'tabular-nums' }}> · {durationOf(now - updating.since)}</span></>
                    ) : (
                      <>Recreates <code>sensorr-api</code>, <code>sensorr-web</code> and <code>sensorr-updater</code></>
                    )}
                  </small>
                )}
              </div>
            )}
            {!updating && failure && <Failure {...failure} />}
            {!updating && !failure && updater?.error && <Failure title="sensorr-updater does not answer" cause={updater.error} logs='sensorr-updater' />}
            {update?.channel !== 'dev' && !loading && (
              ready && !failure ? (
                <details sx={Update.styles.details}>
                  <summary><strong>Manual update</strong></summary>
                  {manual}
                </details>
              ) : (
                <div>
                  <h3>Manual update</h3>
                  {manual}
                </div>
              )
            )}
          </div>
        </article>
      </section>
    </Body>
  )
}

Update.styles = {
  // One gap between blocks, the margins of Settings' paragraphs left out
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    marginTop: 4,
    '&& >p': {
      marginY: 12,
    },
    '&& >div >h3': {
      marginTop: 12,
    },
  },
  state: {
    '&&': {
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'center',
      gap: 8,
      lineHeight: 'normal',
      whiteSpace: 'normal',
    },
  },
  // The dot of an indexer's test (Znabs.tsx), in the cell where a job has its run button (Jobs.tsx)
  dot: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    minWidth: '2.5rem',
    borderLeft: '1px solid',
    borderColor: 'grayDark',
    '>i': {
      display: 'block',
      height: '0.5em',
      width: '0.5em',
      borderRadius: '50%',
      transition: 'background-color 400ms ease-in-out',
    },
  },
  channel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
  },
  // The capsule and pills of CommandTabs.tsx, the pressed pill filled, the other one let through
  channels: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25em',
    height: '1.75em',
    paddingX: '0.1875em',
    boxSizing: 'border-box',
    borderRadius: '2em',
    backgroundColor: 'accentDarkest',
    color: 'whitePure',
    '>span': {
      marginLeft: '0.9em',
      marginRight: '0.6em',
      fontFamily: 'monospace',
      fontSize: '0.625em',
      fontWeight: 'bold',
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
    },
    '>label': {
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.375em',
      height: '1.375em',
      paddingX: '0.6875em',
      boxSizing: 'border-box',
      borderRadius: '1.375em',
      whiteSpace: 'nowrap',
      cursor: 'pointer',
      transition: 'background-color 140ms ease-out',
      '>input': {
        position: 'absolute',
        opacity: 0,
        width: '100%',
        height: '100%',
        margin: 12,
        cursor: 'inherit',
      },
      '>span:first-of-type': {
        fontSize: '0.875em',
        lineHeight: 1,
      },
      '>[data-name]': {
        fontFamily: 'monospace',
        fontSize: '0.8125em',
        fontWeight: 'medium',
        lineHeight: 1.2,
      },
      // The count badge of a command tab
      '>[data-current]': {
        display: 'inline-block',
        height: '1.7em',
        paddingX: '0.6em',
        borderRadius: '0.85em',
        fontFamily: 'monospace',
        fontSize: '0.625em',
        fontWeight: 'semibold',
        lineHeight: '1.7em',
        backgroundColor: 'accentDarkest',
        color: 'whitePure',
      },
      ':has(>[data-current])': {
        paddingRight: '0.375em',
      },
      ':has(>input:checked)': {
        backgroundColor: 'accentDarker',
        '>[data-name]': {
          fontWeight: 'strong',
        },
        '>[data-current]': {
          backgroundColor: 'whitePure',
          color: 'accentDarkest',
        },
      },
      ':has(>input:focus-visible)': {
        outline: '2px solid',
        outlineColor: 'whitePure',
        outlineOffset: '-2px',
      },
      ':has(>input:disabled)': {
        cursor: 'default',
      },
      ':has(>input:disabled:not(:checked))': {
        opacity: 0.5,
      },
    },
  },
  hidden: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    overflow: 'hidden',
    clipPath: 'inset(50%)',
    whiteSpace: 'nowrap',
  },
  action: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    '&& >p': {
      marginY: 12,
    },
  },
  placeholder: {
    position: 'relative',
    display: 'inline-block',
    maxWidth: '100%',
    height: '1em',
    overflow: 'hidden',
    borderRadius: '0.25em',
    backgroundColor: 'grayDark',
    verticalAlign: 'middle',
    '::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      bottom: 0,
      // The keyframes move it by 80% of its width: this size takes the light band past both ends of the bar
      left: '30%',
      width: '200%',
      background: (theme) => `linear-gradient(90deg, transparent 40%, color-mix(in srgb, ${theme.colors.grayDarker} 50%, transparent) 50%, transparent 60%)`,
      animation: `${animations.placeholder} 1.2s ease-in-out infinite`,
    },
    '@media (prefers-reduced-motion: reduce)': {
      '::after': {
        animation: 'none',
      },
    },
  },
  // The warning of Settings, as a job's missing requirement draws it (Jobs.tsx)
  warning: {
    paddingX: 4,
    paddingY: 8,
    backgroundColor: '#FFE9A4',
    color: '#664D06',
    border: '1px solid #664D06',
    borderRadius: '0.25em',
    fontSize: 5,
    '&& > a': {
      color: 'warningDark',
      ':hover': { color: 'warningDarker' },
      ':active': { color: 'warningDarkest' },
    },
  },
  // The alert of Settings, as an indexer's error draws it (Znabs.tsx)
  failure: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    paddingX: 4,
    paddingY: 8,
    backgroundColor: '#ffa4a4',
    color: '#660606',
    border: '1px solid #660606',
    borderRadius: '0.25em',
    fontSize: 5,
    lineHeight: 'body',
  },
  details: {
    '>summary': {
      cursor: 'pointer',
    },
  },
  commands: {
    display: 'block',
    '&&': {
      paddingX: 2,
      paddingY: 4,
    },
    overflowX: 'auto',
    whiteSpace: 'nowrap',
  },
}

export default Update
