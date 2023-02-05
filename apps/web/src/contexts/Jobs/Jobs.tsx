import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import ReconnectingEventSource from 'reconnecting-eventsource'
import { useAuthContext } from '../Auth/Auth'
import { useAPI } from '../../store/api'

const jobsContext = createContext({})

export const Provider = ({ ...props }) => {
  const api = useAPI()
  const { authenticated } = useAuthContext()
  const [loading, setLoading] = useState({ jobs: true, process: true })
  const [jobs, setJobs] = useState({})
  const [process, setProcess] = useState({})

  useEffect(() => {
    if (!authenticated) {
      return
    }

    const eventSource = new ReconnectingEventSource(`/api/jobs?authorization=Bearer%20${api.access_token}`)
    eventSource.onmessage = ({ data }) => {
      const raw = JSON.parse(data)
      setJobs(jobs => raw.job ? {
        ...jobs,
        [raw.job]: {
          ...raw,
          summary: {
            ...jobs[raw.job],
            ...raw.summary,
            treated: (raw.summary?.treated || 0) + (jobs[raw.job]?.summary?.treated || 0),
          },
        },
      } : raw)
      setLoading(loading => ({ ...loading, jobs: false }))
    }

    return () => eventSource.close()
  }, [authenticated])

  useEffect(() => {
    if (!authenticated) {
      return
    }

    const eventSource = new ReconnectingEventSource(`/api/jobs/status?authorization=Bearer%20${api.access_token}`)
    eventSource.onmessage = ({ data }) => {
      const raw = JSON.parse(data)
      setProcess(raw)
      setLoading(loading => ({ ...loading, process: false }))
    }

    return () => eventSource.close()
  }, [authenticated])

  const sorted = useMemo(() => Object.values(jobs).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [jobs])

  return (
    <jobsContext.Provider
      {...props}
      value={{
        loading: Object.values(loading).reduce((acc, curr) => acc || curr, false),
        jobs: sorted,
        process,
      }}
    />
  )
}

export const useJobsContext = () => useContext(jobsContext)
