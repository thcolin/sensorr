import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const jobsContext = createContext({})

export const Provider = ({ ...props }) => {
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState({})

  useEffect(() => {
    const eventSource = new EventSource(`/api/jobs`)
    eventSource.onmessage = ({ data }) => {
      const raw = JSON.parse(data)
      setJobs(jobs => raw.job ? { ...jobs, [raw.job]: raw } : raw)
      setLoading(false)
    }

    return () => eventSource.close()
  }, [])

  const sorted = useMemo(() => Object.values(jobs).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [jobs])

  return (
    <jobsContext.Provider
      {...props}
      value={{
        loading,
        jobs: sorted,
      }}
    />
  )
}

export const useJobsContext = () => useContext(jobsContext)
