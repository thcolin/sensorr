import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import toast from 'react-hot-toast'
import semver from 'semver'
import { Button, Link, Option } from '@sensorr/ui'
import { emojize, useTitle } from '@sensorr/utils'
import { JOB_EMOJIS } from '@sensorr/sensorr'
import Body from '../../layout/Body/Body'
import { useAPI } from '../../store/api'
import { useJobsContext } from '../../contexts/Jobs/Jobs'
import { errorOf } from './Mail'

const CHANNELS = {
  beta: { emoji: '🧪', label: 'Beta', tag: 'beta', source: <>Every <code>vX.Y.Z-beta.N</code> tag of <code>dev</code></> },
  stable: { emoji: '📦', label: 'Stable', tag: 'latest', source: <>Every <code>vX.Y.Z</code> tag of <code>main</code></> },
}

// Pulling the images and recreating three containers takes a minute or two
const PATIENCE = 5 * 60 * 1000

export const availableOf = (update) => {
  const version = update?.channels?.[update?.channel]?.version

  return (version && semver.valid(version) && semver.valid(update.version) && semver.gt(version, update.version)) ? version : null
}

const Failure = ({ title, cause, logs }: { title: string, cause?: string, logs?: string }) => (
  <div sx={Update.styles.failure}>
    <strong>{emojize('🚨', title)}</strong>
    {cause && <span>{cause}</span>}
    {logs && <span>Logs: <strong sx={{ variant: 'code.reset' }}>docker logs {logs}</strong></span>}
  </div>
)

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
  const selected = channel || (update?.channel in CHANNELS ? update.channel : 'stable')
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

  const stateOf = (key) => {
    const { version, error } = update?.channels?.[key] || {}

    if (loading) {
      return '…'
    }

    if (error) {
      return "can't reach GHCR"
    }

    if (!version) {
      return 'no release yet'
    }

    if (key !== update.channel) {
      return <code>v{version}</code>
    }

    return <><code>v{version}</code> {availableOf(update) ? 'available' : 'up to date'}</>
  }

  const action = (() => {
    if (updating) {
      return `⌛ Updating to v${updating.version}`
    }

    if (loading) {
      return '…'
    }

    if (!target) {
      return update?.channels?.[selected]?.error ? `Can't reach GHCR` : `No ${CHANNELS[selected].label.toLowerCase()} release yet`
    }

    if (current) {
      return availableOf(update) ? `Update to v${target}${pinned ? ', replaces your pin' : ''}` : 'Up to date'
    }

    return `Switch to ${CHANNELS[selected].label.toLowerCase()}, v${target}${pinned ? ', replaces your pin' : ''}`
  })()

  const ready = !!updater && !updater.error
  const disabled = loading || !!updating || !target || (current && !availableOf(update)) || !!jobs.length

  const manual = (
    <>
      <p>Set <code>SENSORR_TAG={CHANNELS[selected].tag}</code> in the env file you pass to compose, then:</p>
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
          {update?.error ? (
            <Failure title="Can't read the update status" cause={update.error} logs='sensorr-api' />
          ) : (
            <p sx={Update.styles.running}>
              <code>{update?.version ? `v${update.version}` : '…'}</code>
              {update?.tag && <> · <code>{update.channel}</code></>}
              {pinned && <> · <code title='SENSORR_TAG pins this version'>{emojize('📍', pinned)}</code></>}
              {revision && <> · <code title={update.revision}>{revision}</code></>}
            </p>
          )}
          {update?.channel === 'dev' ? (
            <p>
              This instance follows every push to <code>dev</code>. Set <code>SENSORR_TAG</code> to <code>beta</code> or <code>latest</code> in the env file you pass to compose to follow a release.
            </p>
          ) : (
            <>
              {!update?.error && <div role='radiogroup' aria-label='Channel' sx={{ paddingY: 8 }}>
                {Object.entries(CHANNELS).map(([key, { emoji, label, source }]) => (
                  <Option
                    key={key}
                    type='radio'
                    id={`update-${key}`}
                    name='channel'
                    value={key}
                    checked={selected === key}
                    disabled={loading || !!updating}
                    onChange={() => setChannel(key)}
                  >
                    <div sx={Update.styles.channel}>
                      <span>
                        <strong>{emojize(emoji, label)}</strong>
                        <span>{stateOf(key)}</span>
                      </span>
                      <small>{update?.channels?.[key]?.error || source}</small>
                    </div>
                  </Option>
                ))}
              </div>}
              {(ready || loading) && (
                <>
                  <div sx={{ display: 'flex', marginTop: 4 }}>
                    <Button type='button' color='primary' sx={{ flex: 1 }} disabled={disabled} aria-busy={!!updating} onClick={start}>{action}</Button>
                  </div>
                  {!updating && !!jobs.length && (
                    <p sx={Update.styles.warning}>
                      <strong>Warning</strong>, {jobs.length > 2 ? `${emojize(JOB_EMOJIS[jobs[0]], jobs[0])} and ${jobs.length - 1} more` : jobs.map((job) => emojize(JOB_EMOJIS[job], job)).join(' and ')} {jobs.length > 1 ? 'are running, wait for them or stop them' : 'is running, wait for it or stop it'} in <Link to='/jobs'>Jobs</Link>
                    </p>
                  )}
                  {!disabled && <p><small>Recreates <code>sensorr-api</code>, <code>sensorr-web</code> and <code>sensorr-updater</code></small></p>}
                </>
              )}
              <div role='status' sx={Update.styles.status}>
                {updating ? (
                  <p><small>The page reloads once v{updating.version} answers<span aria-hidden='true' sx={{ fontVariantNumeric: 'tabular-nums' }}> · {durationOf(now - updating.since)}</span></small></p>
                ) : failure ? (
                  <Failure {...failure} />
                ) : updater?.error ? (
                  <Failure title="sensorr-updater does not answer" cause={updater.error} logs='sensorr-updater' />
                ) : null}
              </div>
              {ready && !failure ? (
                <details sx={Update.styles.details}>
                  <summary><strong>Manual update</strong></summary>
                  {manual}
                </details>
              ) : !loading && (
                <>
                  <h3>Manual update</h3>
                  {manual}
                </>
              )}
            </>
          )}
        </article>
      </section>
    </Body>
  )
}

Update.styles = {
  running: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  channel: {
    lineHeight: 'normal',
    paddingY: 10,
    '>span': {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      columnGap: 4,
      rowGap: 10,
    },
    '>small': {
      display: 'block',
      marginTop: 10,
    },
  },
  // The warning of Settings, as a job's missing requirement draws it (Jobs.tsx)
  warning: {
    marginY: 8,
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
  status: {
    width: '100%',
  },
  // The alert of Settings, as an indexer's error draws it (Znabs.tsx)
  failure: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginY: 8,
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
    marginY: 8,
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
