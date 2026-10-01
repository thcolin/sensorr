import { memo } from 'react'
import { Icon } from '@sensorr/ui'
import { jobTitleOf } from '@sensorr/sensorr'
import { useJobRunner } from './Jobs'

interface JobStateProps {
  job: string
  // A `jobNameOf` name
  name: string
  done?: boolean
}

const UIJobState = ({ job, name, done = false }: JobStateProps) => {
  const { stopJob, stopping } = useJobRunner()

  if (done) {
    return <span sx={UIJobState.styles.done}><Icon value='check' height='0.75em' width='0.75em' /></span>
  }

  // The job stays running until the CLI exits, its `done` replaces this button
  if (stopping.includes(job)) {
    return (
      <button type='button' disabled={true} aria-label={`Stopping ${jobTitleOf(name)} job`} sx={UIJobState.styles.stop}>
        <Icon value='spinner' height='0.75em' width='0.75em' />
      </button>
    )
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
    display: 'flex',
    marginRight: 7,
    fontSize: 'inherit',
    cursor: 'pointer',
    pointerEvents: 'auto',
    ':disabled': {
      cursor: 'progress',
      '>div': {
        height: '0.75em',
        width: '0.75em',
      },
    },
    '::before': {
      content: '""',
      position: 'absolute',
      inset: '-0.875em',
    },
    '::after': {
      content: '""',
      display: 'none',
      height: '0.75em',
      width: '0.75em',
      borderRadius: '0.25em',
      backgroundColor: 'error',
    },
    // A tap keeps `:hover` on touch screens, the dot would stay a square after a dismissed confirm
    '@media (hover: hover)': {
      ':hover:not(:disabled)': {
        '>svg': {
          display: 'none',
        },
        '::after': {
          display: 'block',
        },
      },
    },
    ':focus-visible': {
      '>svg': {
        display: 'none',
      },
      '::after': {
        display: 'block',
      },
      outline: '2px solid',
      outlineColor: 'text',
      outlineOffset: '2px',
    },
  },
}

export const JobState = memo(UIJobState)
