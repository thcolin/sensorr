import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'
import { jobTitleOf } from '@sensorr/sensorr'
import i18n from '@sensorr/i18n'
import { errorOf, useAPI } from '../../store/api'
import { useJobsContext } from '../../contexts/Jobs/Jobs'

export interface JobEntry {
  command: string
  type?: string
  description: string
  options: string[]
  // The settings key that has to be set before the job can run
  requires?: 'plex.token' | 'tautulli.url' | 'mail.host'
}

// `label` and `description` are getters: read where they are shown, they follow the language
export const JOB_GROUPS: { label: string, jobs: JobEntry[] }[] = [
  {
    get label() { return i18n.t('sensorr.jobs.groups.movies') },
    jobs: [
      { command: 'record', type: 'movies', get description() { return i18n.t('sensorr.jobs.descriptions.recordMovies') }, options: ['cron', 'proposalOnly'] },
      { command: 'refine', type: 'movies', get description() { return i18n.t('sensorr.jobs.descriptions.refineMovies') }, options: ['cron', 'proposalOnly'] },
      { command: 'shrink', type: 'movies', get description() { return i18n.t('sensorr.jobs.descriptions.shrinkMovies') }, options: ['cron', 'proposalOnly', 'threshold'] },
      { command: 'report', type: 'movies', get description() { return i18n.t('sensorr.jobs.descriptions.reportMovies') }, requires: 'plex.token', options: ['cron', 'proposalOnly'] },
      { command: 'refresh', type: 'movies', get description() { return i18n.t('sensorr.jobs.descriptions.refreshMovies') }, options: ['cron'] },
      { command: 'sync', type: 'movies', get description() { return i18n.t('sensorr.jobs.descriptions.syncMovies') }, requires: 'plex.token', options: ['cron', 'cleanup'] },
    ],
  },
  {
    get label() { return i18n.t('sensorr.jobs.groups.tv') },
    jobs: [
      { command: 'record', type: 'shows', get description() { return i18n.t('sensorr.jobs.descriptions.recordShows') }, options: ['cron', 'proposalOnly'] },
      { command: 'airing', type: 'shows', get description() { return i18n.t('sensorr.jobs.descriptions.airingShows') }, options: ['cron', 'proposalOnly'] },
      { command: 'import', type: 'shows', get description() { return i18n.t('sensorr.jobs.descriptions.importShows') }, options: ['cron'] },
      { command: 'refresh', type: 'shows', get description() { return i18n.t('sensorr.jobs.descriptions.refreshShows') }, options: ['cron'] },
      { command: 'sync', type: 'shows', get description() { return i18n.t('sensorr.jobs.descriptions.syncShows') }, requires: 'plex.token', options: ['cron', 'cleanup'] },
    ],
  },
  {
    get label() { return i18n.t('sensorr.jobs.groups.friends') },
    jobs: [
      { command: 'keep-in-touch', get description() { return i18n.t('sensorr.jobs.descriptions.keepInTouch') }, options: ['cron'] },
      { command: 'wrapped', get description() { return i18n.t('sensorr.jobs.descriptions.wrapped') }, requires: 'tautulli.url', options: ['cron'] },
      { command: 'mail', get description() { return i18n.t('sensorr.jobs.descriptions.mail') }, requires: 'mail.host', options: ['cron'] },
    ],
  },
  {
    get label() { return i18n.t('sensorr.jobs.groups.data') },
    jobs: [
      { command: 'dump', get description() { return i18n.t('sensorr.jobs.descriptions.dump') }, options: ['cron'] },
    ],
  },
]

export const nameOfEntry = ({ command, type }: { command: string, type?: string }) => [command, type].filter(Boolean).join(' ')

export const useJobRunner = ({ onRun = null }: { onRun?: (job: string) => void } = {}) => {
  const api = useAPI()
  const [ongoing, setOngoing] = useState([])
  const { stopping, setStopping } = useJobsContext() as any

  const runJob = useCallback((command, type) => {
    const name = nameOfEntry({ command, type })

    if (!window.confirm(i18n.t('sensorr.jobs.confirm.start', { name: jobTitleOf(name) }))) {
      return false
    }

    setOngoing(ongoing => [...ongoing, name])
    const { uri, params, init } = api.query.jobs.runJob({ body: { command, type } })
    // The API says why it refused: a job already running, or a demo that runs none
    const request = api.fetch(uri, params, init, { rawError: true }).catch(async (err) => {
      throw Object.assign(new Error((await errorOf(err)) || ''), { cause: err })
    })

    toast.promise(request, {
      loading: i18n.t('sensorr.jobs.run.loading', { name: jobTitleOf(name) }),
      success: (data) => {
        setOngoing(ongoing => ongoing.filter(c => c !== name))
        onRun?.(data.job)
        return i18n.t('sensorr.jobs.run.success', { name: jobTitleOf(name), job: data.job })
      },
      error: (err) => {
        console.warn(err)
        setOngoing(ongoing => ongoing.filter(c => c !== name))
        return err.message ? i18n.t('sensorr.jobs.run.errorWith', { name: jobTitleOf(name), message: err.message }) : i18n.t('sensorr.jobs.run.error', { name: jobTitleOf(name) })
      },
    })

    return true
  }, [onRun])

  const stopJob = useCallback((name, job) => {
    if (!window.confirm(i18n.t('sensorr.jobs.confirm.stop', { name: jobTitleOf(name), job }))) {
      return
    }

    setStopping(stopping => [...stopping, job])
    const { uri, params, init } = api.query.jobs.stopJob({ params: { job } })
    const request = api.fetch(uri, params, init)

    toast.promise(request, {
      loading: i18n.t('loading'),
      success: () => i18n.t('sensorr.jobs.stop.success', { job }),
      error: (err) => {
        console.warn(err)
        setStopping(stopping => stopping.filter(j => j !== job))
        return i18n.t('sensorr.jobs.stop.error', { job })
      },
    })
  }, [])

  return { runJob, stopJob, ongoing, stopping }
}
