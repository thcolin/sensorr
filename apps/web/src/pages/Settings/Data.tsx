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

const Data = ({ ...props }) => {
  useTitle('Settings - Data')
  const api = useAPI()
  const { config } = useConfigContext() as any
  const { process } = useJobsContext() as any
  const { runJob } = useJobRunner()
  const [state, setState] = useState(null)
  const [failure, setFailure] = useState(null)
  const [archive, setArchive] = useState(null)
  const [importing, setImporting] = useState(false)
  const input = useRef(null)

  const jobs = useMemo(() => Object.values(process || {}).map(({ command, type }: any) => [command, type].filter(Boolean).join(' ')), [process])
  const dumping = jobs.includes('dump')
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
    try {
      const { uri, params, init } = api.query.dumps.getDump({ params: { name } })
      const url = URL.createObjectURL(await api.fetch(uri, params, init, { blob: true }))
      const link = Object.assign(document.createElement('a'), { href: url, download: name })
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) {
      toast.error(`Error while downloading ${name}, try again`)
    }
  }

  const restore = async () => {
    if (!window.confirm(`Replace ${countsOf(state?.counts)} with the ones of ${archive.name}?`)) {
      return
    }

    setImporting(true)

    try {
      const { uri, params, init } = api.query.jobs.runRestore({ body: { archive } })
      await api.fetch(uri, params, init, { rawError: true })
      toast.success(`${archive.name} is being imported, follow it in Jobs`)
      setArchive(null)
      input.current.value = ''
    } catch (err) {
      toast.error((await errorOf(err)) || `Error while importing ${archive.name}, try again`)
    } finally {
      setImporting(false)
    }
  }

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
                  {state.dumps.map(({ name, size, date }) => (
                    <li key={name}>
                      <div>
                        <strong>{name}</strong>
                        <small>{formatDistanceToNowStrict(new Date(date), { addSuffix: true })} · {filesize.stringify(size)}</small>
                      </div>
                      <Button type='button' variant='outline' color='gray' onClick={() => download(name)} aria-label={`Download ${name}`}>Download</Button>
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
                onChange={(e) => setArchive(e.target.files?.[0] || null)}
                sx={Onboarding.styles.file}
              />
              {archive && !others.length && state && (
                <p role='status' sx={Update.styles.warning}>
                  <strong>Warning</strong>, replaces {countsOf(state.counts)}
                </p>
              )}
              {!!others.length && (
                <p sx={Update.styles.warning}>
                  <strong>Warning</strong>, {others.length > 2 ? `${emojize(JOB_EMOJIS[others[0]], others[0])} and ${others.length - 1} more` : others.map((job) => emojize(JOB_EMOJIS[job], job)).join(' and ')} {others.length > 1 ? 'are running, wait for them or stop them' : 'is running, wait for it or stop it'} in <Link to='/jobs'>Jobs</Link>
                </p>
              )}
              <Button type='button' color='error' sx={{ width: '100%' }} disabled={!archive || importing || !!jobs.length} aria-busy={importing || restoring} onClick={restore}>
                {restoring ? '⌛ Importing' : 'Import'}
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
      '>button': {
        flexShrink: 0,
      },
    },
  },
}

export default Data
