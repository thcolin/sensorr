import { memo } from 'react'
import { Icon, Link } from '@sensorr/ui'
import { RecordJobSummary } from './RecordJob'
import { RefreshJobSummary } from './RefreshJob'

const UIJobSummary = ({ job, timestamp, meta: { command, done, ...meta }, selected = false }) => (
  <Link to={`/jobs/${job}`} sx={UIJobSummary.styles.element}>
    <span
      ref={node => selected && node && node?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })}
      sx={UIJobSummary.styles.wrapper} style={{ opacity: selected ? 1 : 0.5 }}
    >
      <span sx={UIJobSummary.styles.head}>
        <span sx={UIJobSummary.styles.icon}>
          {{ refresh: '🔌', record: '📹' }[command]}
        </span>
        <span sx={UIJobSummary.styles.container}>
          <span sx={{ display: 'flex', alignItems: 'center' }}>
            <span sx={{ marginRight: 7 }}><Icon value={done ? 'check' : 'live'} height='0.75em' width='0.75em' /></span>
            <span sx={UIJobSummary.styles.title}>{job}</span>
          </span>
          <span sx={UIJobSummary.styles.subtitle}>{command} - {new Date(timestamp).toLocaleString()}</span>
        </span>
      </span>
      <span sx={UIJobSummary.styles.summary}>
        {command === 'record' && <RecordJobSummary meta={meta} />}
        {command === 'refresh' && <RefreshJobSummary meta={meta} />}
      </span>
    </span>
  </Link>
)

UIJobSummary.styles = {
  element: {
    display: 'flex',
    borderBottom: '1px solid',
    borderColor: 'gray2',
    paddingY: 3,
  },
  wrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    transition: 'opacity ease 300ms',
    '&:hover': {
      opacity: '1 !important',
    },
  },
  head: {
    display: 'flex',
    alignItems: 'start',
  },
  icon: {
    flexShrink: 0,
    height: '2.5em',
    width: '2.5em',
    backgroundColor: 'gray2',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    marginX: 4,
    marginTop: 10,
  },
  title: {
    fontSize: 4,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  subtitle: {
    marginY: 6,
    fontSize: 7,
    color: 'gray6',
    fontFamily: 'monospace',
  },
  summary: {
    display: 'flex',
    alignItems: 'center',
    marginTop: 8,
    '>span': {
      backgroundColor: 'gray2',
      marginRight: 8,
      fontSize: 6,
      color: 'text',
      fontWeight: 'bold',
      fontFamily: 'monospace',
      borderRadius: '1em',
      whiteSpace: 'nowrap',
      paddingX: 5,
      paddingY: 9,
    },
  },
}

export const JobSummary = memo(UIJobSummary)
