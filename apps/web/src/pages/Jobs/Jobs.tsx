import { Fragment, memo, useEffect, useMemo, useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { Icon, Warning, withControls } from '@sensorr/ui'
import { useJobsContext } from '../../contexts/Jobs/Jobs'
import { compose } from '@sensorr/utils'
import { JobSummary } from './JobSummary'
import { RecordJob } from './RecordJob'
import { RefreshJob } from './RefreshJob'

const UIJobs = ({ controls, ...props }) => {
  const history = useHistory()
  const { jobs, loading } = useJobsContext() as any
  const { job } = useParams() as any
  const [logs, setLogs] = useState(null)

  useEffect(() => {
    if ((!job && !loading && jobs.length) || (!loading && !jobs.find(j => j.job === job) && jobs.length)) {
      history.push(`/jobs/${(jobs[0] as any).job}`)
      return
    }
  }, [jobs, job, loading])

  useEffect(() => {
    if (!job) {
      return
    }

    setLogs(null)
    const eventSource = new EventSource(`/api/jobs/${job}`)
    eventSource.onmessage = ({ data }) => {
      const raw = JSON.parse(data)
      setLogs(logs => Array.isArray(raw) ? raw : [...(logs || []), raw])
    }

    return () => eventSource.close()
  }, [job])

  return (
    <section sx={UIJobs.styles.element}>
      {loading ? (
        <div sx={UIJobs.styles.placeholder}>
          <Warning
            emoji="🏗️"
            title="Loading jobs"
            subtitle="Please wait a few moments..."
          />
        </div>
      ) : !jobs.length ? (
        <div sx={UIJobs.styles.placeholder}>
          <Warning
            emoji="🏗️"
            title="No jobs yet"
            subtitle="Jobs start everyday automatically, but you can start one manually with toolbar below"
          />
        </div>
      ) : (
        <Fragment>
          <aside sx={UIJobs.styles.aside}>
            {jobs.map(j => (
              <JobSummary key={j.job} selected={j.job === job} {...j} />
            ))}
          </aside>
          <div sx={UIJobs.styles.content}>
            {jobs.find(j => j.job === job)?.meta?.command === 'record' ? (
              <RecordJob job={jobs.find(j => j.job === job)} logs={logs} />
            ) : jobs.find(j => j.job === job)?.meta?.command === 'refresh' ? (
              <RefreshJob job={jobs.find(j => j.job === job)} logs={logs} />
            ) : null}
          </div>
        </Fragment>
      )}
    </section>
  )
}

UIJobs.styles = {
  element: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    maxHeight: 'calc(100vh - 130px)',
    width: '100vw',
    overflow: 'hidden',
  },
  placeholder: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aside: {
    minWidth: '20em',
    maxWidth: '20em',
    paddingX: 2,
    borderRight: '1px solid',
    borderColor: 'gray2',
    overflow: 'scroll',
  },
  content: {
    display: 'flex',
    flex: 1,
    overflow: 'scroll',
  }
}

const Jobs = memo(UIJobs)

export default Jobs
