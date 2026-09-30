import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Drawer, Icon, Modal } from '@sensorr/ui'
import { useResponsiveValue } from '@sensorr/utils'
import { JOB_EMOJIS, jobTitleOf } from '@sensorr/sensorr'
import { useConfigContext } from '../../contexts/Config/Config'
import { useJobsContext } from '../../contexts/Jobs/Jobs'
import { JOB_GROUPS, nameOfEntry, useJobRunner } from './Jobs'

const UIStartJob = ({ ...props }) => {
  const navigate = useNavigate()
  const mobile = useResponsiveValue([true, false])
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  const onRun = useCallback((job) => navigate(`/jobs/${job}`, { state: { new: true } }), [])

  return (
    <>
      <button
        type='button'
        onClick={() => setOpen(true)}
        aria-haspopup='dialog'
        aria-label='Start a job'
        title='Start a job'
        sx={UIStartJob.styles.button}
        {...props}
      >
        <Icon value='play' height='1.5em' width='1.5em' />
      </button>
      {mobile ? createPortal((
        <Drawer open={open} close={close} height='85vh'>
          <DrawerHead title='Start a job' />
          <JobList onRun={onRun} close={close} touch={true} />
        </Drawer>
      ), document.body) : (
        <Modal title='Start a job' open={open} close={close} width='30em' background='primary' head='primary' border='accentDarkest'>
          <JobList onRun={onRun} close={close} />
        </Modal>
      )}
    </>
  )
}

UIStartJob.styles = {
  button: {
    variant: 'button.reset',
    display: 'flex',
    alignSelf: 'center',
    padding: 8,
    marginLeft: [6, 4],
    color: 'whitePure',
    ':focus-visible': {
      outline: '2px solid',
      outlineColor: 'whitePure',
      outlineOffset: '2px',
    },
  },
}

export const StartJob = memo(UIStartJob)

// The head of a `Drawer` on `primary`: the Modal's title, and a close beside the knob when asked for
const UIDrawerHead = ({ title, close = null }: { title: string, close?: () => void }) => (
  <div sx={UIDrawerHead.styles.element}>
    <h3>{title}</h3>
    {close && (
      <button type='button' onClick={close} aria-label='Close'>
        <Icon value='clear' active={true} height='1.25em' width='1.25em' />
      </button>
    )}
  </div>
)

UIDrawerHead.styles = {
  element: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingX: 4,
    paddingTop: 2,
    paddingBottom: 6,
    '>h3': {
      variant: 'heading.default',
      margin: 12,
      fontSize: 2,
      lineHeight: 1.3,
      color: 'whitePure',
    },
    '>button': {
      variant: 'button.reset',
      display: 'flex',
      padding: 8,
      color: 'whitePure',
      ':focus-visible': {
        outline: '2px solid',
        outlineColor: 'whitePure',
        outlineOffset: '2px',
      },
    },
  },
}

export const DrawerHead = memo(UIDrawerHead)

// A palette: arrows or the pointer move the active job, Enter or a click runs it, or stops it while it runs.
// On touch nothing is active at first: a tap picks a job, a second tap runs it, so a stray tap while scrolling runs nothing.
const UIJobList = ({ onRun, close, touch = false }) => {
  const { config } = useConfigContext() as any
  const { process } = useJobsContext() as any
  const { runJob, stopJob, ongoing } = useJobRunner({ onRun })
  const entries = useMemo(() => JOB_GROUPS.flatMap(({ label, jobs }) => jobs.map(entry => ({ ...entry, group: label, name: nameOfEntry(entry) }))), [])
  const [active, setActive] = useState(touch ? -1 : 0)

  useEffect(() => {
    document.getElementById(`start-job-${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const stateOf = (entry) => ({
    running: Object.values(process).find((p: any) => p.command === entry.command && p.type === entry.type) as any,
    unconfigured: !!entry.requires && !config.get(entry.requires),
    pending: ongoing.includes(entry.name),
  })

  const trigger = (entry) => {
    if (!entry) {
      return
    }

    const { running, unconfigured, pending } = stateOf(entry)

    if (unconfigured || pending) {
      return
    }

    if (running) {
      stopJob(entry.name, running.job)
      return
    }

    runJob(entry.command, entry.type)
    close()
  }

  const onKeyDown = (e) => {
    if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) {
      return
    }

    e.preventDefault()

    if (e.key === 'Enter') {
      trigger(entries[active])
      return
    }

    setActive(active => (active + (e.key === 'ArrowDown' ? 1 : entries.length - 1)) % entries.length)
  }

  return (
    <div
      role='listbox'
      aria-label='Jobs'
      tabIndex={0}
      data-autofocus={true}
      aria-activedescendant={`start-job-${active}`}
      onKeyDown={onKeyDown}
      sx={UIJobList.styles.element}
    >
      {JOB_GROUPS.map(({ label }) => (
        <section key={label} role='group' aria-labelledby={`start-job-${label}`}>
          <h6 id={`start-job-${label}`}>{label}</h6>
          <div>
            {entries.map((entry, index) => {
              if (entry.group !== label) {
                return null
              }

              const { running, unconfigured, pending } = stateOf(entry)

              return (
                <div
                  key={entry.name}
                  id={`start-job-${index}`}
                  role='option'
                  aria-selected={index === active}
                  aria-disabled={unconfigured || pending}
                  aria-label={`${running ? 'Stop' : 'Start'} ${jobTitleOf(entry.name)}`}
                  onPointerMove={(e) => e.pointerType === 'mouse' && index !== active && setActive(index)}
                  onClick={() => touch && index !== active ? setActive(index) : trigger(entry)}
                >
                  <span aria-hidden={true}>{JOB_EMOJIS[entry.name]}</span>
                  <span>
                    <code>{entry.command}</code>
                    <small>{unconfigured ? `Needs ${entry.requires.split('.')[0]}, see Settings` : entry.description}</small>
                  </span>
                  <span aria-hidden={true}>
                    {running ? (
                      <Icon value='live' height='0.625em' width='0.625em' />
                    ) : index === active && !unconfigured && !pending ? (
                      <Icon value='play' height='0.6875em' width='0.6875em' />
                    ) : null}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

UIJobList.styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    flex: ['1 1 auto', 'none'],
    minHeight: 0,
    overflowY: ['auto', 'visible'],
    fontSize: ['1.125em', 'inherit'],
    marginX: 8,
    marginBottom: 8,
    paddingX: 10,
    paddingBottom: 10,
    borderRadius: '0.375em',
    backgroundColor: 'accentDarkest',
    // The active option carries the focus, the list does not draw it
    ':focus': {
      outline: 'none',
    },
    '>section': {
      '>h6': {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5em',
        margin: 12,
        paddingTop: '0.875rem',
        paddingX: '0.625rem',
        paddingBottom: '0.3125rem',
        fontFamily: 'heading',
        fontWeight: 'bold',
        fontSize: 6,
        lineHeight: 1,
        color: 'whitePure',
        '::after': {
          content: '""',
          flex: 1,
          height: '1px',
          backgroundColor: 'rgba(255, 255, 255, 0.16)',
        },
      },
      ':first-of-type>h6': {
        paddingTop: '0.5rem',
      },
      '>div': {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      },
    },
    '[role="option"]': {
      display: 'flex',
      alignItems: 'center',
      gap: '0.625em',
      paddingY: 9,
      paddingLeft: '0.625em',
      paddingRight: 9,
      borderRadius: '0.25em',
      scrollMargin: '0.75em',
      color: 'whitePure',
      cursor: 'pointer',
      '>span:first-of-type': {
        flexShrink: 0,
        width: '1.125em',
        textAlign: 'center',
        fontSize: '0.9375em',
        lineHeight: 1,
      },
      '>span:nth-of-type(2)': {
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.1875em',
        '>code': {
          fontFamily: 'monospace',
          fontSize: '0.78125em',
          fontWeight: 'semibold',
          lineHeight: 1.2,
        },
        // White at 85% on `accentDarkest` measures 4.58:1
        '>small': {
          fontSize: '0.6875em',
          lineHeight: 1.3,
          color: 'rgba(255, 255, 255, 0.85)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        },
      },
      '>span:last-of-type': {
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '1.25em',
      },
      '&[aria-selected="true"]': {
        backgroundColor: 'accentDarker',
        '>span:nth-of-type(2)>small': {
          color: 'whitePure',
        },
      },
      '&[aria-disabled="true"]': {
        cursor: 'not-allowed',
        '>*': {
          opacity: 0.5,
        },
      },
    },
  },
}

const JobList = memo(UIJobList)
