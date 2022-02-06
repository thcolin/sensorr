import { Fragment, memo, useMemo } from 'react'
import { Entities, Icon, Warning } from '@sensorr/ui'
import { emojize } from '@sensorr/utils'
import Tippy from '@tippyjs/react'
import Person from '../../components/Person/Person'
import Movie from '../../components/Movie/Movie'

export const RefreshJobSummary = ({ meta, ...props }) => (
  <Fragment>
    <Tippy content={<code>📚 <span><strong>{(meta.movie || 0) + (meta.person || 0)}</strong> Refreshed API Data from TMDB</span></code>}>
      <span>📚 {(meta.movie || 0) + (meta.person || 0)}</span>
    </Tippy>
    <Tippy content={<code>🎞️ <span><strong>{meta.movie || 0}</strong> Refreshed movies from TMDB</span></code>}>
      <span>🎞️ {meta.movie || 0}</span>
    </Tippy>
    <Tippy content={<code>🎭 <span><strong>{meta.person || 0}</strong> Refreshed persons from TMDB</span></code>}>
      <span>🎭 {meta.person || 0}</span>
    </Tippy>
  </Fragment>
)

const UIRefreshJob = ({ job, logs }) => {
  const entities = useMemo(() => (logs || []).reduce((groups, log) => !log.meta.entity ? groups : {
    ...groups,
    [log.meta.type]: [
      ...(groups[log.meta.type] || []),
      log.meta.entity,
    ].sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
  }, {}), [logs])

  return (
    <div sx={UIRefreshJob.styles.element}>
      <div>
        <Warning
          emoji='🔌'
          title={(
            <span sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span sx={{ marginRight: 7 }}><Icon value={job.meta.done ? 'check' : 'live'} height='0.75em' width='0.75em' /></span>
              <span sx={UIRefreshJob.styles.title}>{job.job}</span>
            </span>
          )}
          subtitle={(
            <span sx={UIRefreshJob.styles.subtitle}>{job.meta.command} - {new Date(job.timestamp).toLocaleString()}</span>
          )}
          children={(
            <span>
              <span sx={UIRefreshJob.styles.summary}>
                <RefreshJobSummary meta={job.meta} />
              </span>
            </span>
          )}
          sx={{
            paddingTop: 'unset !important',
            '>h2': {
              textTransform: 'unset !important',
            },
          }}
        />
      </div>
      <div sx={UIRefreshJob.styles.content}>
        {logs === null ? (
          <div sx={UIRefreshJob.styles.placeholder}>
            <Icon value='spinner' />
          </div>
        ) : (entities?.movie?.length || entities?.person?.length) ? (
          <div sx={UIRefreshJob.styles.entities}>
            <Entities
              entities={entities?.person}
              length={entities?.person?.length}
              label={emojize('🎭', 'Persons')}
              display='grid'
              hide={true}
              child={Person}
              props={() => ({
                display: 'poster',
              })}
            />
            <Entities
              entities={entities?.movie}
              length={entities?.movie?.length}
              label={emojize('🎞️', 'Movies')}
              display='grid'
              hide={true}
              child={Movie}
              props={() => ({
                display: 'poster',
              })}
            />
          </div>
        ) : (
          <Warning emoji='⏳' title='Loading' subtitle='Waiting first entity refresh...' />
        )}
      </div>
    </div>
  )
}

UIRefreshJob.styles = {
  element: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: 0,
    overflowX: 'hidden',
  },
  link: {
    color: 'primary',
    opacity: 0.8,
    cursor: 'pointer',
    textDecoration: 'underline',
    fontFamily: 'monospace',
    ':hover': {
      opacity: 1,
    },
  },
  title: {
    fontFamily: 'monospace',
  },
  subtitle: {
    color: 'gray6',
    fontFamily: 'monospace',
  },
  summary: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    '>span': {
      backgroundColor: 'gray2',
      marginRight: 8,
      color: 'text',
      fontWeight: 'bold',
      fontFamily: 'monospace',
      borderRadius: '1em',
      whiteSpace: 'nowrap',
      paddingX: 5,
      paddingY: 9,
      cursor: 'pointer',
      transition: 'all ease 100ms',
    },
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  placeholder: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entities: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
}

export const RefreshJob = memo(UIRefreshJob)
