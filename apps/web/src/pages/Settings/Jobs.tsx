import React, { useCallback, useState } from 'react'
import { Option, Icon, Button, Link } from '@sensorr/ui'
import { emojize, useTitle } from '@sensorr/utils'
import { useOutletContext } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import cronParser from 'cron-parser'
import cronstrue from 'cronstrue'
import { useAPI } from '../../store/api'
import { useConfigContext } from '../../contexts/Config/Config'
import { useJobsContext } from '../../contexts/Jobs/Jobs'
import Body from '../../layout/Body/Body'
import { JOB_EMOJIS } from '../Jobs/Jobs'

const JobsSettings = ({ ...props }) => {
  useTitle('Settings - Jobs')
  const api = useAPI()
  const { config } = useConfigContext()
  const { onSave } = useOutletContext() as any
  const form = useForm({ defaultValues: config.getProperties() })
  const { process } = useJobsContext() as any
  const [ongoing, setOngoing] = useState([])

  const runJob = useCallback(async (command, type) => {
    const name = [command, type].filter(Boolean).join(' ')
    setOngoing(ongoing => [...ongoing, name])
    const { uri, params, init } = api.query.jobs.runJob({ body: { command, type } })
    const request = api.fetch(uri, params, init)

    toast.promise(request, {
      loading: `Running new Job **${name}**, please wait...`,
      success: (data) => {
        setOngoing(ongoing => ongoing.filter(c => c !== name))
        return `Job **${name}** successfully run (${data.job})`
      },
      error: (err) => {
        console.warn(err)
        setOngoing(ongoing => ongoing.filter(c => c !== name))
        return `Error during Job **${name}** run`
      },
    })
  }, [])

  // The report and sync jobs read from Plex
  const plex = {
    disabled: !config.get('plex.token'),
    warning: config.get('plex.token') ? null : (
      <span sx={{ '>a': { color: 'warningDark', ':hover:not(:disabled)': { color: 'warningDarker' }, ':active': { color: 'warningDarkest' } } }}>
        <strong>Warning</strong>, you need to register your Plex server on dedicated <Link to='/settings/plex'>"Plex" Settings page</Link> first
      </span>
    ),
  }

  const stopJob = useCallback(async (name, job) => {
    if (!confirm(`Do you really want to stop ${name} job "${job}" ?`)) {
      return
    }

    const { uri, params, init } = api.query.jobs.stopJob({ params: { job } })
    const request = api.fetch(uri, params, init)

    toast.promise(request, {
      loading: 'Loading...',
      success: (data) => {
        // console.log(data)
        return `Job "${job}" successfully stop`
      },
      error: (err) => {
        console.warn(err)
        return `Error during Job "${job}" stop`
      },
    })
  }, [])

  return (
    <Body>
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
          <p sx={{ paddingBottom: 4 }} style={{ lineHeight: 2 }}>
            For shows, the <code>📹 Record shows</code> job looks for the wanted episodes of <code>🔖 Followed</code> shows, by whole series, then season packs, then episodes; <code>📡 Airing shows</code> looks for episodes aired in the last 7 days.{' '}
            <code>📥 Import shows</code> hard links finished files from staging into the library and marks those episodes <code>📼 Owned</code>.
          </p>
          <h2>Jobs</h2>
          <p>
            Sensorr schedules background jobs for application operation, use <a href='https://crontab.guru/' target='_blank' rel='noopener noreferrer'>cron</a> syntax to set frequency. Use the "play" button to trigger a job manually
          </p>
        </article>
        <article>
          <form onSubmit={form.handleSubmit(onSave)} >
            {[
              {
                label: 'Movies',
                jobs: [
                  {
                    command: 'record',
                    type: 'movies',
                    description: 'Record Sensorr wished movies',
                    options: ['cron', 'proposalOnly'],
                  },
                  {
                    command: 'refine',
                    type: 'movies',
                    description: 'Refine archived movies with better fitting release',
                    options: ['cron', 'proposalOnly'],
                  },
                  {
                    command: 'shrink',
                    type: 'movies',
                    description: 'Shrink refined movies with smallest release available',
                    options: ['cron', 'proposalOnly', 'threshold'],
                  },
                  {
                    command: 'report',
                    type: 'movies',
                    description: 'Replace archived movies reported from Plex with their best release',
                    ...plex,
                    options: ['cron', 'proposalOnly'],
                  },
                  {
                    command: 'refresh',
                    type: 'movies',
                    description: 'Refresh Sensorr movies and persons with TMDB changes',
                    options: ['cron'],
                  },
                  {
                    command: 'sync',
                    type: 'movies',
                    description: 'Sync Sensorr library with registered Plex server',
                    ...plex,
                    options: ['cron', 'cleanup'],
                  },
                ],
              },
              {
                label: 'Shows',
                jobs: [
                  {
                    command: 'record',
                    type: 'shows',
                    description: 'Record wished shows by whole series, season packs and episodes',
                    options: ['cron', 'proposalOnly'],
                  },
                  {
                    command: 'airing',
                    type: 'shows',
                    description: 'Record wanted episodes aired in the last 7 days',
                    options: ['cron', 'proposalOnly'],
                  },
                  {
                    command: 'import',
                    type: 'shows',
                    description: 'Import finished show releases from the staging folder into the library',
                    options: ['cron'],
                  },
                  {
                    command: 'refresh',
                    type: 'shows',
                    description: 'Refresh Sensorr shows and their episodes with TMDB changes',
                    options: ['cron'],
                  },
                  {
                    command: 'sync',
                    type: 'shows',
                    description: 'Sync Sensorr shows with registered Plex server',
                    ...plex,
                    options: ['cron'],
                  },
                ],
              },
              {
                label: 'Friends',
                jobs: [
                  {
                    command: 'keep-in-touch',
                    description: 'Goes through guests Plex watchlist: requested movies become wished, requested shows arrive not followed',
                    options: ['cron'],
                  },
                ],
              },
            ].map(({ label, jobs }) => (
              <React.Fragment key={label}>
                <h3>{label}</h3>
                {jobs.map((value: any) => (
                  <JobSettings
                    key={[value.command, value.type].filter(Boolean).join(' ')}
                    {...value}
                    running={Object.values(process).find((p: any) => p.command === value.command && p.type === value.type)}
                    disabled={value.disabled || ongoing.includes([value.command, value.type].filter(Boolean).join(' '))}
                    runJob={runJob}
                    stopJob={stopJob}
                    control={form.control}
                    watch={form.watch}
                  />
                ))}
              </React.Fragment>
            ))}
            <div sx={{ display: 'flex', marginTop: 4 }}>
              <Button type='submit' color='primary' sx={{ flex: 1 }}>Save</Button>
            </div>
          </form>
        </article>
      </section>
    </Body>
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

const JobSettings = ({ command, type = undefined, description, warning = null, options, running, runJob, stopJob, control, watch, disabled = false, ...props }) => {
  const name = [command, type].filter(Boolean).join(' ')
  const emoji = JOB_EMOJIS[name]
  const key = ['jobs', command, type].filter(Boolean).join('.')
  const cronValue = watch(`${key}.cron`)
  const paused = watch(`${key}.paused`)

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
          <h5>{emojize(emoji, name)}</h5>
          <p>{description}</p>
        </div>
        <div sx={{ display: 'flex' }}>
          <button
            type='button'
            sx={JobSettings.styles.run}
            aria-label={running ? `Stop ${name}` : `Run ${name}`}
            title={running ? `Stop ${name}` : `Run ${name}`}
            onClick={() => (running ? stopJob(name, running.job) : runJob(command, type))}
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
          style={options.length > 1 ? { borderBottomLeftRadius: '0rem', borderBottomRightRadius: '0rem' } : {}}
        >
          <React.Fragment>
            <Controller
              name={`${key}.paused`}
              control={control}
              render={({ field: { value: checked, onChange } }) => (
                <Option type='checkbox' id={`${key}.paused`} checked={!checked} onChange={(e: any) => onChange(!e.target.checked)}>
                  <div sx={{ lineHeight: 'normal', paddingY: 10, whiteSpace: 'nowrap', marginRight: 0 }}>
                    <strong>{emojize('🤖', 'Scheduled')}</strong>
                    <br />
                    <small>{paused ? 'Paused' : cronString}</small>
                  </div>
                </Option>
              )}
            />
            <Controller
              name={`${key}.cron`}
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
            name={`${key}.proposalOnly`}
            control={control}
            render={({ field: { value: checked, onChange } }) => (
              <Option
                type='checkbox'
                id={`${key}.proposalOnly`}
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
      {options.includes('cleanup') && (
        <div sx={JobSettings.styles.options}>
          <Controller
            name={`${key}.cleanup`}
            control={control}
            render={({ field: { value: checked, onChange } }) => (
              <Option
                type='checkbox'
                id={`${key}.cleanup`}
                checked={checked}
                onChange={(e: any) => onChange(e.target.checked)}
              >
                <div sx={{ lineHeight: 'normal', paddingY: 10 }}>
                  <strong>{emojize('🧹', 'Cleanup')}</strong>
                  <br />
                  <small>
                    Once an accepted swap has landed on Plex, will <strong>delete</strong> the versions it replaces, files included
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
            name={`${key}.threshold`}
            control={control}
            render={({ field: { value, onChange } }) => (
              <Option
                type='checkbox'
                id={`${key}.threshold`}
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
            name={`${key}.threshold`}
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
      // Wider than the longest name, so every description starts on the same line; on a phone the description needs the room
      minWidth: [null, '12em'],
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '2.5rem',
    minHeight: '2.5rem',
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
