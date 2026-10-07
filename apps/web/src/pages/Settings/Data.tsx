import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { formatDistanceToNowStrict } from 'date-fns'
import cronstrue from 'cronstrue'
import 'cronstrue/locales/fr'
import { Trans, useTranslation } from 'react-i18next'
import i18n, { dateLocale } from '@sensorr/i18n'
import { Button, Link } from '@sensorr/ui'
import { emojize, filesize, useTitle } from '@sensorr/utils'
import { DUMP_KEPT, JOB_EMOJIS } from '@sensorr/sensorr'
import Body from '../../layout/Body/Body'
import { useAPI, errorOf } from '../../store/api'
import { useConfigContext } from '../../contexts/Config/Config'
import { useJobsContext } from '../../contexts/Jobs/Jobs'
import { useJobRunner } from '../../components/Sensorr/Jobs'
import Onboarding from '../Onboarding/Onboarding'
import Update from './Update'
import Lists from './Lists'

const COLLECTIONS = ['movies', 'shows', 'episodes', 'persons']

export const countsOf = (counts: { [collection: string]: number }) => COLLECTIONS
  .map((collection) => i18n.t(`settings.data.counts.${collection}`, { count: counts?.[collection] || 0 }))
  .join(', ')

const sourceOf = (manifest) => i18n.t('settings.data.source', { date: new Date(manifest.date).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }), version: manifest.version })

const Data = ({ ...props }) => {
  const { t } = useTranslation()
  useTitle(t('settings.documentTitle', { page: t('settings.sections.backup') }))
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
      setFailure(t('settings.data.list.error', { error: err.message }))
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
      toast.error(t('settings.data.download.error', { name, error: err.message }))
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
      setPreview({ error: (await errorOf(err)) || t('settings.data.preview.error', { name: file.name, error: err.message }) })
    }
  }

  const restore = async ({ label, manifest, request }) => {
    if (!window.confirm(t('settings.data.restore.confirm', { current: countsOf(state?.counts), next: countsOf(manifest.counts), source: sourceOf(manifest) }))) {
      return
    }

    setImporting(true)

    try {
      const { uri, params, init } = request
      await api.fetch(uri, params, init, { rawError: true })
      toast.success(t('settings.data.restore.started', { label }))
    } catch (err) {
      toast.error((await errorOf(err)) || t('settings.data.restore.error', { label }))
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
          <h2>{t('settings.sections.backup')}</h2>
          <p><Trans t={t} i18nKey='settings.data.intro' components={[<code />]} /></p>
          <div sx={Update.styles.stack}>
            <div sx={Update.styles.action}>
              <Button type='button' color='primary' sx={{ width: '100%' }} disabled={dumping || restoring} aria-busy={dumping} onClick={() => runJob('dump', undefined)}>
                {dumping ? t('settings.data.dump.running') : t('settings.data.dump.label')}
              </Button>
              <small sx={Update.styles.muted}>
                <Trans
                  t={t}
                  i18nKey={schedule?.paused ? 'settings.data.dump.paused' : 'settings.data.dump.scheduled'}
                  values={{ kept: DUMP_KEPT, job: emojize(JOB_EMOJIS.dump, 'dump'), schedule: schedule?.paused ? null : cronstrue.toString(schedule?.cron || '', { use24HourTimeFormat: true, locale: i18n.language }).toLowerCase() }}
                  components={[<Link to='/settings/schedule' />]}
                />
              </small>
            </div>
            {failure && (
              <div role='alert' sx={Update.styles.failure}>
                <strong>{emojize('🚨', failure)}</strong>
              </div>
            )}
            {state && (
              state.dumps.length ? (
                <ul sx={Data.styles.dumps} aria-label={t('settings.data.dumps')}>
                  {state.dumps.map(({ name, size, date, manifest }) => (
                    <li key={name}>
                      <div>
                        <strong>{name}</strong>
                        <small>{formatDistanceToNowStrict(new Date(date), { addSuffix: true, locale: dateLocale() })} · {filesize.stringify(size)}</small>
                      </div>
                      <div>
                        <Button type='button' variant='outline' color='gray' disabled={!!downloading} aria-busy={downloading === name} onClick={() => download(name)} aria-label={t('settings.data.download.label', { name })}>{downloading === name ? t('settings.data.download.running') : t('settings.data.download.action')}</Button>
                        <Button
                          type='button'
                          color='error'
                          disabled={!manifest || blocked}
                          title={manifest ? undefined : t('settings.data.manifest', { name })}
                          onClick={() => restore({ label: name, manifest, request: api.query.dumps.restoreDump({ params: { name } }) })}
                          aria-label={t('settings.data.import.label', { name })}
                        >
                          {t('settings.data.import.action')}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p sx={Update.styles.muted}>{t('settings.data.empty')}</p>
              )
            )}
            <div sx={Update.styles.action}>
              <h3>{t('settings.data.import.title')}</h3>
              <p>{t('settings.data.import.help')}</p>
              <div sx={Data.styles.pick}>
                <input
                  ref={input}
                  type='file'
                  accept='.zip,application/zip'
                  aria-label={t('settings.data.import.file')}
                  disabled={importing || restoring}
                  onChange={(e) => pick(e.target.files?.[0] || null)}
                  sx={Onboarding.styles.file}
                />
                <button type='button' disabled={!preview?.manifest || !state || blocked} aria-busy={importing || restoring || !!preview?.loading} onClick={restoreArchive} sx={Data.styles.import}>
                  {importing || restoring ? t('settings.data.import.running') : t('settings.data.import.action')}
                </button>
              </div>
              {preview?.error && (
                <div role='alert' sx={Update.styles.failure}>
                  <strong>{emojize('🚨', preview.error)}</strong>
                </div>
              )}
              {preview?.manifest && !others.length && state && (
                <p role='status' sx={Update.styles.warning}>
                  <Trans t={t} i18nKey='settings.data.import.warning' values={{ current: countsOf(state.counts), next: countsOf(preview.manifest.counts), source: sourceOf(preview.manifest) }} components={[<strong />]} />
                </p>
              )}
              {!!others.length && (
                <p sx={Update.styles.warning}>
                  <Trans
                    t={t}
                    i18nKey='settings.running.warning'
                    values={{ count: others.length, jobs: others.length > 2 ? t('settings.running.more', { job: emojize(JOB_EMOJIS[others[0]], others[0]), count: others.length - 1 }) : others.map((job) => emojize(JOB_EMOJIS[job], job)).join(t('settings.running.and')) }}
                    components={[<strong />, <Link to='/jobs' />]}
                  />
                </p>
              )}
            </div>
          </div>
        </article>
      </section>
    </Body>
  )
}

Data.styles = {
  // The field and its action on one line, as Settings › Lists creates a list
  pick: {
    display: 'flex',
    flexDirection: ['column', 'row'],
    alignItems: 'stretch',
    '>input': {
      flex: 1,
      minWidth: 0,
      borderTopRightRadius: ['0.25em', '0rem'],
      borderBottomRightRadius: '0rem',
      borderBottomLeftRadius: ['0rem', '0.25em'],
    },
  },
  import: {
    ...Lists.styles.plus,
    paddingY: ['0.75em', '0px'],
    borderTopRightRadius: ['0rem', '0.25rem'],
    borderBottomLeftRadius: ['0.25rem', '0rem'],
    fontFamily: 'heading',
    fontWeight: 'semibold',
    backgroundColor: 'error',
    '&:hover:not(:disabled)': {
      backgroundColor: 'errorDarker',
    },
    '&:active:not(:disabled)': {
      backgroundColor: 'errorDarkest',
    },
  },
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
