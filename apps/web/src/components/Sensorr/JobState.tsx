import { memo } from 'react'
import { Icon } from '@sensorr/ui'
import { jobNameOf, jobTitleOf } from '@sensorr/sensorr'
import { useJobRunner } from './Jobs'

interface JobStateProps {
  job: string
  meta: { command: string, type?: string, done?: boolean }
}

// A job done shows a check; a running one a dot that turns into a stop square under the pointer or the keyboard focus
const UIJobState = ({ job, meta }: JobStateProps) => {
  const { stopJob } = useJobRunner()
  const name = jobNameOf(meta)

  if (meta.done) {
    return <span sx={UIJobState.styles.done}><Icon value='check' height='0.75em' width='0.75em' /></span>
  }

  return (
    <button type='button' onClick={() => stopJob(name, job)} aria-label={`Stop ${jobTitleOf(name)} job`} title='Stop' sx={UIJobState.styles.stop}>
      <Icon value='live' height='0.75em' width='0.75em' />
    </button>
  )
}

UIJobState.styles = {
  done: {
    marginRight: 7,
  },
  stop: {
    variant: 'button.reset',
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    marginRight: 7,
    fontSize: 'inherit',
    cursor: 'pointer',
    '::before': {
      content: '""',
      position: 'absolute',
      inset: '-0.75em',
    },
    '::after': {
      content: '""',
      display: 'none',
      height: '0.75em',
      width: '0.75em',
      borderRadius: '0.125em',
      backgroundColor: 'grayDarkest',
    },
    ':hover, :focus-visible': {
      '>svg': {
        display: 'none',
      },
      '::after': {
        display: 'block',
      },
    },
    ':focus-visible': {
      outline: '2px solid',
      outlineColor: 'text',
      outlineOffset: '2px',
    },
  },
}

export const JobState = memo(UIJobState)
