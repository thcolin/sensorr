import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
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
import { errorOf } from './Mail'

const CHANNELS = {
  stable: { emoji: '📦', tag: 'latest', source: 'vX.Y.Z tag of main' },
  beta: { emoji: '🧪', tag: 'beta', source: 'vX.Y.Z-beta.N tag of dev' },
  dev: { emoji: '🚧', tag: 'dev', source: 'push to dev' },
}

// Pulling the images and recreating three containers takes a minute or two
const PATIENCE = 5 * 60 * 1000

// The dev image always carries the version "dev": its revision tells one push from the next
const labelOf = (key, { version = null, revision = null } = {}) => key === 'dev' ? revision?.slice(0, 7) : version && `v${version}`

const runs = (update, key, { version = null, revision = null } = {}) => key === 'dev' ? update.tag === 'dev' && update.revision === revision : update.version === version

export const availableOf = (update) => {
  const { version, revision } = update?.channels?.[update?.channel] || {}

  if (update?.channel === 'dev') {
    return (revision && update.revision && revision !== update.revision) ? labelOf('dev', { revision }) : null
  }

  return (version && semver.valid(version) && semver.valid(update.version) && semver.gt(version, update.version)) ? labelOf(update.channel, { version }) : null
}

const Failure = ({ title, cause, logs }: { title: string, cause?: string, logs?: string }) => (
  <div role='alert' sx={Update.styles.failure}>
    <strong>{emojize('🚨', title)}</strong>
    {cause && <span>{cause}</span>}
    {logs && <span>Logs: <strong sx={{ variant: 'code.reset' }}>docker logs {logs}</strong></span>}
  </div>
)

const Placeholder = ({ width, height }: { width: string, height: string }) => <span aria-hidden={true} sx={{ ...Update.styles.placeholder, width, height }} />

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
  const capsule = useRef(null)
  const [pill, setPill] = useState(null)

  const loading = !update
  const updater = update?.updater
  const selected = channel || (update?.channel in CHANNELS ? update.channel : loading ? null : 'stable')
  const target = labelOf(selected, update?.channels?.[selected])
  const current = selected === update?.channel
  const jobs = useMemo(() => Object.values(process || {}).map(({ command, type }: any) => [command, type].filter(Boolean).join(' ')), [process])
  const revision = update?.revision?.slice(0, 7)
  const pinned = update?.channel in CHANNELS && update.tag !== CHANNELS[update.channel].tag ? update.tag : null

  // Measured after layout, once the checked label has its bold width; no slide on the first render
  useLayoutEffect(() => {
    const label = capsule.current?.querySelector('label:has(>input:checked)')
    setPill((previous) => label ? { x: label.offsetLeft, width: label.offsetWidth, slide: !!previous } : null)
  }, [selected, loading])

  // Settings stays mounted across its pages: its answer may predate an update started here
  useEffect(() => {
    loadUpdate()
  }, [])

  // A run still going, or failed, outlives the page: a reload, or a visit elsewhere in Settings
  useEffect(() => {
    const run = updater?.run
    const key = Object.keys(CHANNELS).find((key) => CHANNELS[key].tag === run?.tag)
    const image = update?.channels?.[key]
    const label = labelOf(key, image)

    if (!key || !label || runs(update, key, image)) {
      return
    }

    if (run.status === 'running') {
      setFailure(null)
      setUpdating({ key, image, label, since: Date.parse(run.started) })
    } else if (run.code !== 0) {
      setFailure({ title: `The last update, to ${label}, failed`, cause: `sensorr-updater-run exited (${run.code})`, logs: 'sensorr-updater-run' })
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

        if (runs(raw, updating.key, updating.image)) {
          return window.location.reload()
        }

        if (raw.updater?.run?.status === 'exited' && raw.updater.run.code !== 0) {
          setFailure({ title: `Update to ${updating.label} failed`, cause: `sensorr-updater-run exited (${raw.updater.run.code})`, logs: 'sensorr-updater-run' })
          return setUpdating(null)
        }
      } catch (err) {
        // sensorr-api and sensorr-web are being recreated
      }

      if (Date.now() - updating.since > PATIENCE) {
        setFailure({ title: `Update to ${updating.label} failed`, cause: `${updating.label} still does not answer after ${PATIENCE / 60000} minutes`, logs: 'sensorr-updater-run' })
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
      setUpdating({ key: selected, image: update.channels[selected], label: target, since: Date.now() })
    } catch (err) {
      toast.error((await errorOf(err)) || `Error while updating to ${target}, try again`)
    }
  }

  const available = availableOf(update)
  const unreachable = !!update?.channels?.[update?.channel]?.error

  const status = (() => {
    if (updating) {
      return <>Updating<span aria-hidden='true' sx={{ fontVariantNumeric: 'tabular-nums' }}> · {durationOf(now - updating.since)}</span></>
    }

    if (!update?.channel) {
      return 'SENSORR_TAG is not set'
    }

    if (unreachable) {
      return "Can't reach GHCR"
    }

    return available ? `${available} available` : 'Up to date'
  })()

  const state = (failure || updater?.error) ? 'error' : (updating || available || unreachable) ? 'warning' : !update?.channel ? 'grayDarker' : 'success'

  const reasonOf = (key) => {
    const { error } = update?.channels?.[key] || {}

    return labelOf(key, update?.channels?.[key]) ? null : error ? `can't reach GHCR, ${error}` : key === 'dev' ? 'no build yet' : 'no release yet'
  }

  const source = (key) => [
    <>Every {CHANNELS[key].source}, {reasonOf(key) || `latest ${labelOf(key, update.channels[key])}`}.</>,
    ...Object.keys(CHANNELS).filter((other) => other !== key && reasonOf(other)).map((other) => <> {other[0].toUpperCase() + other.slice(1)}: {reasonOf(other)}.</>),
  ]

  const ready = !!updater && !updater.error
  const actionable = !!updating || (!!target && (!current || !!available))
  const disabled = !!updating || !!jobs.length

  const action = updating
    ? `⌛ Updating to ${updating.label}`
    : current
      ? `Update to ${target}${pinned ? ', replaces your pin' : ''}`
      : `Switch to ${selected}, ${target}${pinned ? ', replaces your pin' : ''}`

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

  return (
    <Body>
      <section>
        <article>
          <h2>Update</h2>
          <div sx={Update.styles.stack}>
            {update?.error ? (
              <Failure title="Can't read the update status" cause={update.error} logs='sensorr-api' />
            ) : (
              <div sx={Update.styles.panel} aria-busy={loading}>
                <div sx={Update.styles.running}>
                  <span>{loading ? <Placeholder width='10.5rem' height='1.25rem' /> : `v${update.version}`}</span>
                  {loading ? <small><Placeholder width='11.25rem' height='0.875rem' /></small> : (
                    <small>
                      {update.channel || 'no'} channel
                      {pinned && <> · <span title='SENSORR_TAG pins this version'>📍 pinned</span></>}
                      {revision && <> · revision <span title={update.revision}>{revision}</span></>}
                    </small>
                  )}
                </div>
                {loading ? <Placeholder width='6.875rem' height='1.125rem' /> : (
                  <span role='status' sx={Update.styles.status}>
                    <i sx={{ backgroundColor: state }} />
                    <span>{status}</span>
                  </span>
                )}
              </div>
            )}
            {!update?.error && (
              <div sx={Update.styles.channel}>
                <h3 id='update-channel'>Channel</h3>
                <div ref={capsule} role='radiogroup' aria-labelledby='update-channel' sx={Update.styles.channels}>
                  {pill && <span aria-hidden={true} style={{ width: pill.width, transform: `translateX(${pill.x}px)`, transition: pill.slide ? undefined : 'none' }} />}
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
                      {emojize(emoji, key)}
                    </label>
                  ))}
                </div>
                <small sx={Update.styles.muted}>{loading ? <Placeholder width='20rem' height='0.75rem' /> : source(selected)}</small>
              </div>
            )}
            {ready && actionable && (
              <div sx={Update.styles.action}>
                <Button type='button' color='primary' sx={{ width: '100%' }} disabled={disabled} aria-busy={!!updating} onClick={start}>{action}</Button>
                {!updating && !!jobs.length ? (
                  <p sx={Update.styles.warning}>
                    <strong>Warning</strong>, {jobs.length > 2 ? `${emojize(JOB_EMOJIS[jobs[0]], jobs[0])} and ${jobs.length - 1} more` : jobs.map((job) => emojize(JOB_EMOJIS[job], job)).join(' and ')} {jobs.length > 1 ? 'are running, wait for them or stop them' : 'is running, wait for it or stop it'} in <Link to='/jobs'>Jobs</Link>
                  </p>
                ) : (
                  <small sx={Update.styles.muted}>
                    {updating ? `The page reloads once ${updating.label} answers` : 'Recreates sensorr-api, sensorr-web and sensorr-updater'}
                  </small>
                )}
              </div>
            )}
            {!updating && failure && <Failure {...failure} />}
            {!updating && !failure && updater?.error && <Failure title="sensorr-updater does not answer" cause={updater.error} logs='sensorr-updater' />}
            {!loading && (
              ready && !failure ? (
                <details sx={Update.styles.details}>
                  <summary><strong>Manual update</strong></summary>
                  {manual}
                </details>
              ) : (
                <div sx={Update.styles.manual}>
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
  // One gap between blocks, the margins of Settings' paragraphs and titles left out
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
  panel: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: 4,
    rowGap: 8,
    paddingY: 4,
    paddingX: 3,
    borderRadius: '0.25em',
    backgroundColor: 'grayLight',
  },
  running: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 10,
    minWidth: 0,
    '>span': {
      fontFamily: 'monospace',
      fontSize: 3,
      fontWeight: 'bold',
      lineHeight: '1.75rem',
      whiteSpace: 'nowrap',
    },
    '>small': {
      fontSize: 5,
      color: 'grayDarkest',
    },
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    gap: 8,
    fontSize: 5,
    fontWeight: 'semibold',
    '>i': {
      display: 'block',
      height: '0.5rem',
      width: '0.5rem',
      borderRadius: '50%',
      transition: 'background-color 400ms ease-in-out',
    },
  },
  channel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
    '&& >h3': {
      marginBottom: 12,
    },
  },
  // The capsule of CommandTabs.tsx, the pressed pill filled, the other one let through
  channels: {
    display: 'inline-flex',
    gap: '0.25rem',
    padding: '0.25rem',
    borderRadius: '2em',
    backgroundColor: 'accentDarkest',
    position: 'relative',
    '>span': {
      position: 'absolute',
      top: '0.25rem',
      bottom: '0.25rem',
      left: '0px',
      borderRadius: '2em',
      backgroundColor: 'accentDarker',
      transition: 'transform 400ms cubic-bezier(0.4, 0, 0.2, 1), width 400ms cubic-bezier(0.4, 0, 0.2, 1)',
      '@media (prefers-reduced-motion: reduce)': {
        transition: 'none',
      },
    },
    '>label': {
      position: 'relative',
      paddingY: '0.375rem',
      paddingX: '1rem',
      borderRadius: '2em',
      fontFamily: 'monospace',
      fontSize: 5,
      color: 'primaryLightest',
      whiteSpace: 'nowrap',
      cursor: 'pointer',
      transition: 'color 400ms cubic-bezier(0.4, 0, 0.2, 1)',
      '>input': {
        position: 'absolute',
        inset: '0px',
        opacity: 0,
        width: '100%',
        height: '100%',
        margin: 12,
        cursor: 'inherit',
      },
      ':has(>input:checked)': {
        color: 'whitePure',
        fontWeight: 'strong',
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
        opacity: 0.45,
      },
    },
  },
  muted: {
    color: 'grayDarkest',
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
    overflow: 'hidden',
    borderRadius: '0.25em',
    backgroundColor: 'grayDark',
    verticalAlign: 'middle',
    '::after': {
      content: '""',
      position: 'absolute',
      top: '0px',
      bottom: '0px',
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
  manual: {
    marginTop: 8,
  },
  details: {
    marginTop: 8,
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
