import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'
import { jobTitleOf } from '@sensorr/sensorr'
import { useAPI } from '../../store/api'

export interface JobEntry {
  command: string
  type?: string
  description: string
  options: string[]
  // The settings key that has to be set before the job can run
  requires?: 'plex.token' | 'tautulli.url'
}

export const JOB_GROUPS: { label: string, jobs: JobEntry[] }[] = [
  {
    label: 'Movies',
    jobs: [
      { command: 'record', type: 'movies', description: 'Record Sensorr wished movies', options: ['cron', 'proposalOnly'] },
      { command: 'refine', type: 'movies', description: 'Refine archived movies with better fitting release', options: ['cron', 'proposalOnly'] },
      { command: 'shrink', type: 'movies', description: 'Shrink refined movies with smallest release available', options: ['cron', 'proposalOnly', 'threshold'] },
      { command: 'report', type: 'movies', description: 'Replace archived movies reported from Plex with their best release', requires: 'plex.token', options: ['cron', 'proposalOnly'] },
      { command: 'refresh', type: 'movies', description: 'Refresh Sensorr movies and persons with TMDB changes', options: ['cron'] },
      { command: 'sync', type: 'movies', description: 'Sync Sensorr library with registered Plex server', requires: 'plex.token', options: ['cron', 'cleanup'] },
    ],
  },
  {
    label: 'TV',
    jobs: [
      { command: 'record', type: 'shows', description: 'Record wished shows by whole series, season packs and episodes', options: ['cron', 'proposalOnly'] },
      { command: 'airing', type: 'shows', description: 'Record wanted episodes aired in the last 7 days', options: ['cron', 'proposalOnly'] },
      { command: 'import', type: 'shows', description: 'Import finished show releases from the staging folder into the library', options: ['cron'] },
      { command: 'refresh', type: 'shows', description: 'Refresh Sensorr shows and their episodes with TMDB changes', options: ['cron'] },
      { command: 'sync', type: 'shows', description: 'Sync Sensorr shows with registered Plex server', requires: 'plex.token', options: ['cron', 'cleanup'] },
    ],
  },
  {
    label: 'Friends',
    jobs: [
      { command: 'keep-in-touch', description: 'Goes through guests Plex watchlist: requested movies become wished, requested shows arrive not followed', options: ['cron'] },
      { command: 'wrapped', description: 'Import the Plex watch history from Tautulli and compute each friend wrapped', requires: 'tautulli.url', options: ['cron'] },
    ],
  },
]

export const nameOfEntry = ({ command, type }: { command: string, type?: string }) => [command, type].filter(Boolean).join(' ')

export const useJobRunner = ({ onRun = null }: { onRun?: (job: string) => void } = {}) => {
  const api = useAPI()
  const [ongoing, setOngoing] = useState([])

  const runJob = useCallback((command, type) => {
    const name = nameOfEntry({ command, type })
    setOngoing(ongoing => [...ongoing, name])
    const { uri, params, init } = api.query.jobs.runJob({ body: { command, type } })
    const request = api.fetch(uri, params, init)

    toast.promise(request, {
      loading: `Running new Job **${jobTitleOf(name)}**, please wait...`,
      success: (data) => {
        setOngoing(ongoing => ongoing.filter(c => c !== name))
        onRun?.(data.job)
        return `Job **${jobTitleOf(name)}** successfully run (${data.job})`
      },
      error: (err) => {
        console.warn(err)
        setOngoing(ongoing => ongoing.filter(c => c !== name))
        return `Error during Job **${jobTitleOf(name)}** run`
      },
    })
  }, [onRun])

  const stopJob = useCallback((name, job) => {
    if (!confirm(`Do you really want to stop ${jobTitleOf(name)} job "${job}" ?`)) {
      return
    }

    const { uri, params, init } = api.query.jobs.stopJob({ params: { job } })
    const request = api.fetch(uri, params, init)

    toast.promise(request, {
      loading: 'Loading...',
      success: () => `Job "${job}" successfully stop`,
      error: (err) => {
        console.warn(err)
        return `Error during Job "${job}" stop`
      },
    })
  }, [])

  return { runJob, stopJob, ongoing }
}
