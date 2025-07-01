import React, { useCallback, useState } from 'react'
import { Option, Icon, Button, Link } from '@sensorr/ui'
import { emojize } from '@sensorr/utils'
import { useOutletContext } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import cronParser from 'cron-parser'
import cronstrue from 'cronstrue'
import { useAPI } from '../../store/api'
import { useConfigContext } from '../../contexts/Config/Config'
import { useJobsContext } from '../../contexts/Jobs/Jobs'

const JobsSettings = ({ ...props }) => {
  const api = useAPI()
  const { config } = useConfigContext()
  const { onSave } = useOutletContext() as any
  const form = useForm({ defaultValues: config.getProperties() })
  const { process } = useJobsContext() as any
  const [ongoing, setOngoing] = useState([])

  const runJob = useCallback(async (command) => {
    setOngoing(ongoing => [...ongoing, command])
    const { uri, params, init } = api.query.jobs.runJob({ body: { command } })
    const request = api.fetch(uri, params, init)

    toast.promise(request, {
      loading: `Running new Job **${command}**, please wait...`,
      success: (data) => {
        setOngoing(ongoing => ongoing.filter(c => c !== command))
        return `Job **${command}** successfully run (${data.job})`
      },
      error: (err) => {
        console.warn(err)
        setOngoing(ongoing => ongoing.filter(c => c !== command))
        return `Error during Job **${command}** run`
      },
    })
  }, [])

  const stopJob = useCallback(async (command, job) => {
    if (!confirm(`Do you really want to stop ${command} job "${job}" ?`)) {
      return
    }

    const { uri, params, init } = api.query.jobs.stopJob({ params: { job } })
    const request = api.fetch(uri, params, init)

    toast.promise(request, {
      loading: 'Loading...',
      success: (data) => {
        console.log(data)
        return `Job "${job}" successfully stop`
      },
      error: (err) => {
        console.warn(err)
        return `Error during Job "${job}" stop`
      },
    })
  }, [])

  return (
    <section sx={JobsSettings.styles.element}>
      <article>
        <h2>Lifecycle Logic</h2>
        <p sx={{ paddingBottom: 4 }}>
          The <code>📹 Record</code> job acts upon <code>🍿 Wished</code> movies, finding and downloading the best-scored version to change their status to <code>📼 Archived</code>.
        </p>
        <p sx={{ paddingBottom: 4 }} style={{ lineHeight: 2 }}>
          An <code>📼 Archived</code> release failing to meet <code>* Required</code> policy rules is considered as <code>🪨 Unrefined</code> and will be treated by <code>✨ Refine</code> job which will seek a <code>💎 Refined</code> version for this release with a better score.
          Subsequently, the <code>✂️ Shrink</code> job will optimize <code>💎 Refined</code> releases by finding smaller <code>💍 Shrinked</code> ones.
        </p>
        <p sx={{ paddingBottom: 4 }}>
          If a movie is <code>📍 Pinned</code>, it will not be treated by jobs. If <code>🔕 Ignored</code>, it is fully excluded from the system.
        </p>
        <h2>Jobs</h2>
        <p>
          Sensorr schedules background jobs for application operation, use <a href='https://crontab.guru/' target='_blank' rel='noopener noreferrer'>cron</a> syntax to set frequency. Use the "play" button to trigger a job manually
        </p>
      </article>
      <form onSubmit={form.handleSubmit(onSave)} >
        {[
          {
            command: 'record',
            emoji: '📹',
            description: 'Record Sensorr wished movies',
            options: ['cron', 'proposalOnly'],
          },
          {
            command: 'refine',
            emoji: '✨',
            description: 'Refine archived movies with better fitting release',
            options: ['cron', 'proposalOnly'],
          },
          {
            command: 'shrink',
            emoji: '✂️',
            description: 'Shrink refined movies with smallest release available',
            options: ['cron', 'proposalOnly', 'threshold'],
          },
          {
            command: 'refresh',
            emoji: '🔌',
            description: 'Refresh Sensorr data with TMDB changes',
            options: ['cron'],
          },
          {
            command: 'sync',
            emoji: '🔗',
            description: 'Sync Sensorr library with registered Plex server',
            disabled: !config.get('plex.token'),
            warning: config.get('plex.token') ? null : (
              <span sx={{ '>a': { color: 'warningDark', ':hover:not(:disabled)': { color: 'warningDarker' }, ':active': { color: 'warningDarkest' } } }}>
                <strong>Warning</strong>, you need to register your Plex server on dedicated <Link to='/settings/plex'>"Plex" Settings page</Link> first
              </span>
            ),
            options: ['cron'],
          },
          {
            command: 'keep-in-touch',
            emoji: '🍻',
            description: 'Goes through guests Plex watchlist and sync wished movies',
            options: ['cron'],
          },
        ].map(value => (
          <JobSettings
            {...value}
            running={Object.values(process).find((p: any) => p.command === value.command)}
            disabled={value.disabled || ongoing.includes(value.command)}
            runJob={runJob}
            stopJob={stopJob}
            control={form.control}
            watch={form.watch}
          />
        ))}
        <div sx={{ display: 'flex', marginTop: 4 }}>
          <Button type='submit' color='primary' sx={{ flex: 1 }}>Save</Button>
        </div>
      </form>
    </section>
  )
}

JobsSettings.styles = {
  element: {
    code: {
      variant: 'code.tag',
    },
    p: {
      marginY: 8,
      lineHeight: 'body',
    },
    h3: {
      marginY: 8,
    },
    a: {
      color: 'primary',
      ':hover': {
        color: 'accent',
      },
    },
    form: {
      width: '100%',
      paddingX: 8,
    },
  },
}

export default JobsSettings

const JobSettings = ({ command, emoji, description, warning = null, options, running, runJob, stopJob, control, watch, disabled = false, ...props }) => {
  const cronValue = watch(`jobs.${command}.cron`)
  const paused = watch(`jobs.${command}.paused`)

  let cronString = ''

  try {
    cronParser.parseExpression(cronValue)
    cronString = cronstrue.toString(cronValue, {
      throwExceptionOnParseError: true,
      use24HourTimeFormat: true,
      verbose: true,
    })
  } catch (e) {
    cronString = 'Invalid syntax, see crontab.guru for help'
  }

  return (
    <div sx={JobSettings.styles.element}>
      <div sx={JobSettings.styles.container}>
        <div sx={JobSettings.styles.metadata}>
          <h5>{emojize(emoji, command)}</h5>
          <p>{description}</p>
        </div>
        <div sx={{ display: 'flex' }}>
          <button
            type='button'
            sx={JobSettings.styles.run}
            onClick={() => (running ? stopJob(command, running.job) : runJob(command))}
            disabled={disabled}
          >
            <Icon value={running ? 'live' : 'play'} height='1em' width='1em' />
          </button>
        </div>
      </div>
      {!!warning && (
        <div
          data-disabled='true'
          sx={{
            ...JobSettings.styles.options,
            borderBottomLeftRadius: '0rem',
            borderBottomRightRadius: '0rem',
            backgroundColor: '#FFE9A4',
            color: '#664D06',
            paddingX: 4,
            paddingY: 8,
          }}
        >
          {warning}
        </div>
      )}
      {options.includes('cron') && (
        <div
          sx={JobSettings.styles.options}
          style={options.includes('proposalOnly') ? { borderBottomLeftRadius: '0rem', borderBottomRightRadius: '0rem' } : {}}
        >
          <React.Fragment>
            <Controller
              name={`jobs.${command}.paused`}
              control={control}
              render={({ field: { value: checked, onChange } }) => (
                <Option type='checkbox' id={`jobs.${command}.paused`} checked={!checked} onChange={(e: any) => onChange(!e.target.checked)}>
                  <div sx={{ lineHeight: 'normal', paddingY: 10, whiteSpace: 'nowrap', marginRight: 0 }}>
                    <strong>{emojize('🤖', 'Scheduled')}</strong>
                    <br />
                    <small>{paused ? 'Paused' : cronString}</small>
                  </div>
                </Option>
              )}
            />
            <Controller
              name={`jobs.${command}.cron`}
              control={control}
              rules={{
                required: !paused,
                validate: (value) => {
                  if (paused) {
                    return true
                  }

                  try {
                    cronParser.parseExpression(value)
                    return true
                  } catch (e) {
                    return false
                  }
                },
              }}
              render={({ field: { ref, ...field } }) => (
                <input
                  type='text'
                  {...field}
                  disabled={paused}
                  sx={{
                    variant: 'input.reset',
                    width: 'auto',
                    maxWidth: '15em',
                    paddingX: 4,
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    borderLeft: '1px solid',
                    borderColor: 'grayDark',
                    ':disabled': {
                      color: 'grayDark',
                    },
                  }}
                />
              )}
            />
          </React.Fragment>
        </div>
      )}
      {options.includes('proposalOnly') && (
        <div sx={JobSettings.styles.options}>
          <Controller
            name={`jobs.${command}.proposalOnly`}
            control={control}
            render={({ field: { value: checked, onChange } }) => (
              <Option
                type='checkbox'
                id={`jobs.${command}.proposalOnly`}
                checked={checked}
                onChange={(e: any) => onChange(e.target.checked)}
              >
                <div sx={{ lineHeight: 'normal', paddingY: 10 }}>
                  <strong>{emojize('🛎', 'Proposal only')}</strong>
                  <br />
                  <small>
                    Won't download best release, will only <strong>propose</strong> it, up to you to decide whether to accept or refuse it
                    later
                  </small>
                </div>
              </Option>
            )}
          />
        </div>
      )}
      {options.includes('threshold') && (
        <div sx={JobSettings.styles.options}>
          <Controller
            name={`jobs.${command}.threshold`}
            control={control}
            render={({ field: { value, onChange } }) => (
              <Option
                type='checkbox'
                id={`jobs.${command}.threshold`}
                checked={value > 0}
                onChange={(e: any) => onChange(e.target.checked ? (value ? value : 1) : 0)}
              >
                <div sx={{ lineHeight: 'normal', paddingY: 10, marginRight: 4 }}>
                  <strong>{emojize('📦', 'Threshold')}</strong>
                  <br />
                  <small>Will consider movies with releases under this threshold as valid and will not shrink them</small>
                </div>
              </Option>
            )}
          />
          <Controller
            name={`jobs.${command}.threshold`}
            control={control}
            render={({ field: { ref, ...field } }) => (
              <div
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  maxWidth: ['5em', '15em'],
                  borderLeft: '1px solid',
                  borderColor: 'grayDark',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                }}
              >
                <input
                  type='number'
                  {...field}
                  sx={{
                    variant: 'input.reset',
                    appearance: 'textfield',
                    flex: 1,
                    paddingX: 4,
                    fontFamily: 'monospace',
                    textAlign: 'right',
                    ':disabled': {
                      color: 'grayDark',
                    },
                  }}
                />
                <div>Gb</div>
              </div>
            )}
          />
        </div>
      )}
    </div>
  )
}

JobSettings.styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    marginY: 2,
  },
  container: {
    display: 'flex',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    border: '1px solid',
    borderColor: 'grayDark',
    borderRadius: '0.25rem',
    overflow: 'hidden',
  },
  metadata: {
    display: 'flex',
    alignItems: 'stretch',
    overflow: 'hidden',
    '>h5': {
      display: 'flex',
      alignItems: 'center',
      margin: 12,
      paddingY: 12,
      paddingX: 6,
      backgroundColor: 'grayLight',
      borderTopLeftRadius: '0.25rem',
      borderBottomLeftRadius: '0.25rem',
      borderRight: '1px solid',
      borderColor: 'grayDark',
      fontFamily: 'monospace',
      whiteSpace: 'nowrap',
    },
    '>p': {
      display: 'flex',
      alignItems: 'center',
      marginY: 12,
      marginX: 6,
      padding: 12,
      fontSize: 5,
      whiteSpace: 'nowrap',
      overflow: 'auto',
    },
  },
  run: {
    variant: 'button.reset',
    paddingY: 8,
    paddingX: 6,
    fontSize: 5,
    borderLeft: '1px solid',
    borderColor: 'grayDark',
    lineHeight: 1.5,
    borderTopRightRadius: '0.25rem',
    borderBottomRightRadius: '0.25rem',
    ':hover:not(:disabled)': {
      backgroundColor: 'gray',
    },
    ':disabled': {
      opacity: 0.5,
    },
  },
  options: {
    display: 'flex',
    alignItems: 'stretch',
    marginX: 8,
    paddingX: 4,
    fontSize: 5,
    backgroundColor: 'grayLighter',
    border: '1px solid',
    borderColor: 'grayDark',
    borderRadius: '0.25rem',
    borderTop: 'none',
    borderTopLeftRadius: '0rem',
    borderTopRightRadius: '0rem',
    lineHeight: 'body',
    ':not([data-disabled]):hover': {
      backgroundColor: 'grayLight',
    },
    '>label': {
      flex: 1,
    },
  },
}
