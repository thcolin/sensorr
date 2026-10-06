import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { formatDistanceToNowStrict } from 'date-fns'
import cronstrue from 'cronstrue'
import { Button, Link } from '@sensorr/ui'
import { emojize, filesize, useTitle } from '@sensorr/utils'
import { DUMP_KEPT, JOB_EMOJIS } from '@sensorr/sensorr'
import Body from '../../layout/Body/Body'
import { useAPI } from '../../store/api'
import { useConfigContext } from '../../contexts/Config/Config'
import { useJobsContext } from '../../contexts/Jobs/Jobs'
import { useJobRunner } from '../../components/Sensorr/Jobs'
import Onboarding from '../Onboarding/Onboarding'
import { errorOf } from './Mail'
import Update from './Update'

const LABELS = { movies: 'movies', shows: 'TV shows', episodes: 'episodes', persons: 'stars' }

export const countsOf = (counts: { [collection: string]: number }) => Object.entries(LABELS)
  .map(([collection, label]) => `${(counts?.[collection] || 0).toLocaleString('en-US')} ${label}`)
  .join(', ')

const sourceOf = (manifest) => `a dump of ${new Date(manifest.date).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}, Sensorr ${manifest.version}`

const Data = ({ ...props }) => {
  useTitle('Settings - Data')
  const api = useAPI()
  const { config } = useConfigContext() as any
  const { process } = useJobsContext() as any
  const { runJob, ongoing } = useJobRunner()
  const [state, setState] = useState(null)
  const [failure, setFailure] = useState(null)
  const [archive, setArchive] = useState(null)
  const [preview, setPreview] = useState(null)
  const [importing, setImporting] = useState(false)
  const [downloading, setDownloading] = useState(null)
  const input = useRef(null)

  const jobs = useMemo(() => Object.values(process || {}).map(({ command, type }: any) => [command, type].filter(Boolean).join(' ')), [process])
  const dumping = jobs.includes('dump') || ongoing.includes('dump')
  const restoring = jobs.includes('restore')
  const others = jobs.filter((job) => job !== 'dump')
  const schedule = config.get('jobs.dump')

  const load = useCallback(async () => {
    try {
      const { uri, params, init } = api.query.dumps.getDumps()
      setState(await api.fetch(uri, params, init))
      setFailure(null)
    } catch (err) {
      setFailure(`Can't list the dumps, ${err.message}`)
    }
  }, [])

  // A dump or a restore that ends changes what the page shows
  useEffect(() => {
    load()
  }, [dumping, restoring])

  const download = async (name) => {
    setDownloading(name)

    try {
      const { uri, params, init } = api.query.dumps.getDump({ params: { name } })
      const url = URL.createObjectURL(await api.fetch(uri, params, init, { blob: true }))
      const link = Object.assign(document.createElement('a'), { href: url, download: name })
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) {
      toast.error(`Error while downloading ${name}, ${err.message}`)
    } finally {
      setDownloading(null)
    }
  }

  // What a picked dump holds, read by the API, so the warning and the confirmation say what comes in
  const pick = async (file) => {
    setArchive(file)
    setPreview(file && { loading: true })

    if (!file) {
      return
    }

    try {
      const { uri, params, init } = api.query.dumps.previewDump({ body: { archive: file } })
      setPreview({ manifest: await api.fetch(uri, params, init, { rawError: true }) })
    } catch (err) {
      setPreview({ error: (await errorOf(err)) || `Can't read ${file.name}, ${err.message}` })
    }
  }

  const restore = async ({ label, manifest, request }) => {
    if (!window.confirm(`Replace ${countsOf(state?.counts)} with ${countsOf(manifest.counts)} of ${sourceOf(manifest)}?`)) {
      return
    }

    setImporting(true)

    try {
      const { uri, params, init } = request
      await api.fetch(uri, params, init, { rawError: true })
      toast.success(`${label} is being imported, follow it in Jobs`)
    } catch (err) {
      toast.error((await errorOf(err)) || `Error while importing ${label}, try again`)
    } finally {
      setImporting(false)
    }
  }

  const restoreArchive = async () => {
    await restore({ label: archive.name, manifest: preview.manifest, request: api.query.jobs.runRestore({ body: { archive } }) })
    setArchive(null)
    setPreview(null)
    input.current.value = ''
  }

  const blocked = importing || restoring || !!jobs.length

  return (
    <Body>
      <section>
        <article>
          <h2>Data</h2>
          <p>Your library and its settings in a <code>.zip</code> of plain JSON: movies, TV shows, episodes and stars, then every setting but the keys and passwords, which never leave this Sensorr.</p>
          <div sx={Update.styles.stack}>
            <div sx={Update.styles.action}>
              <Button type='button' color='primary' sx={{ width: '100%' }} disabled={dumping || restoring} aria-busy={dumping} onClick={() => runJob('dump', undefined)}>
                {dumping ? '⌛ Dumping' : 'Dump now'}
              </Button>
              <small sx={Update.styles.muted}>
                Keeps the last {DUMP_KEPT}. The {emojize(JOB_EMOJIS.dump, 'dump')} job {schedule?.paused ? 'is paused' : `runs ${cronstrue.toString(schedule?.cron || '', { use24HourTimeFormat: true }).toLowerCase()}`}, in <Link to='/settings/jobs'>Settings › Jobs</Link>
              </small>
            </div>
            {failure && (
              <div role='alert' sx={Update.styles.failure}>
                <strong>{emojize('🚨', failure)}</strong>
              </div>
            )}
            {state && (
              state.dumps.length ? (
                <ul sx={Data.styles.dumps} aria-label='Dumps'>
                  {state.dumps.map(({ name, size, date, manifest }) => (
                    <li key={name}>
                      <div>
                        <strong>{name}</strong>
                        <small>{formatDistanceToNowStrict(new Date(date), { addSuffix: true })} · {filesize.stringify(size)}</small>
                      </div>
                      <div>
                        <Button type='button' variant='outline' color='gray' disabled={!!downloading} aria-busy={downloading === name} onClick={() => download(name)} aria-label={`Download ${name}`}>{downloading === name ? '⌛ Downloading' : 'Download'}</Button>
                        <Button
                          type='button'
                          variant='outline'
                          color='error'
                          disabled={!manifest || blocked}
                          title={manifest ? undefined : `${name} has no manifest.json this Sensorr reads`}
                          onClick={() => restore({ label: name, manifest, request: api.query.dumps.restoreDump({ params: { name } }) })}
                          aria-label={`Import ${name}`}
                        >
                          Import
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p sx={Update.styles.muted}>No dump yet.</p>
              )
            )}
            <div sx={Update.styles.action}>
              <h3>Import</h3>
              <p>A dump of this Sensorr or of another one replaces the library and the settings of this Sensorr. Its keys and passwords stay.</p>
              <input
                ref={input}
                type='file'
                accept='.zip,application/zip'
                aria-label='Dump to import'
                disabled={importing || restoring}
                onChange={(e) => pick(e.target.files?.[0] || null)}
                sx={Onboarding.styles.file}
              />
              {preview?.error && (
                <div role='alert' sx={Update.styles.failure}>
                  <strong>{emojize('🚨', preview.error)}</strong>
                </div>
              )}
              {preview?.manifest && !others.length && state && (
                <p role='status' sx={Update.styles.warning}>
                  <strong>Warning</strong>, replaces {countsOf(state.counts)} with {countsOf(preview.manifest.counts)} of {sourceOf(preview.manifest)}
                </p>
              )}
              {!!others.length && (
                <p sx={Update.styles.warning}>
                  <strong>Warning</strong>, {others.length > 2 ? `${emojize(JOB_EMOJIS[others[0]], others[0])} and ${others.length - 1} more` : others.map((job) => emojize(JOB_EMOJIS[job], job)).join(' and ')} {others.length > 1 ? 'are running, wait for them or stop them' : 'is running, wait for it or stop it'} in <Link to='/jobs'>Jobs</Link>
                </p>
              )}
              <Button type='button' color='error' sx={{ width: '100%' }} disabled={!preview?.manifest || !state || blocked} aria-busy={importing || restoring || !!preview?.loading} onClick={restoreArchive}>
                {importing || restoring ? '⌛ Importing' : 'Import'}
              </Button>
            </div>
          </div>
        </article>
      </section>
    </Body>
  )
}

Data.styles = {
  dumps: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    '&&': {
      margin: '0px',
      padding: '0px',
      listStyle: 'none',
    },
    '>li': {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 4,
      paddingY: 8,
      paddingX: 3,
      borderRadius: '0.25em',
      backgroundColor: 'grayLight',
      '>div': {
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        minWidth: 0,
        // A file name is data: monospace, without the pill of a code sample
        '>strong': {
          fontFamily: 'monospace',
          lineHeight: 'heading',
          fontWeight: 'semibold',
          overflowWrap: 'anywhere',
        },
        '>small': {
          fontSize: 5,
          color: 'grayDarkest',
        },
      },
      '>div:last-of-type': {
        flexDirection: 'row',
        flexShrink: 0,
        gap: 8,
      },
    },
  },
}

export default Data
