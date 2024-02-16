import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Option, Label, Icon, Button } from '@sensorr/ui'
import toast from 'react-hot-toast'
import { Controller, useForm } from 'react-hook-form'
import { countries, flag, name } from 'country-emoji'
import cronParser from 'cron-parser'
import cl from 'country-language'
import cronstrue from 'cronstrue'
import { useAPI } from '../../store/api'
import { useConfigContext } from '../../contexts/Config/Config'
import { useJobsContext } from '../../contexts/Jobs/Jobs'
import { emojize } from '@sensorr/utils'

const General = ({ ...props }) => {
  const { config } = useConfigContext()
  const form = useForm({ defaultValues: config.getProperties() })

  console.log(form.formState.errors)

  const onSubmit = useCallback((data) => {
    console.log(data)
  }, [])

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} sx={General.styles.element}>
      <TMDBSettings control={form.control} />
      <JobsSettings control={form.control} watch={form.watch} />
    </form>
  )
}

General.styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    alignItems: 'center',
    paddingX: 2,
    paddingBottom: 0,
    code: {
      variant: 'code.tag',
    },
    p: {
      marginY: 8,
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
    section: {
      width: '100%',
      paddingX: 4,
      maxWidth: '96rem',
      '>div': {
        paddingY: 8,
      }
    },
  },
}

export default General

const TMDBSettings = ({ control, ...props }) => {
  const [regions, setRegions] = useState([])

  useEffect(() => {
    (async () => {
      const regions = (await Promise.all(
        Object.keys(countries).map(country => new Promise(resolve => cl.getCountryLanguages(country, (err, languages) => {
          if (!err && languages && languages.length && languages[0].iso639_1) {
            resolve({ country, language: languages[0].iso639_1, emoji: flag(country), name: name(country) })
          } else {
            resolve(null)
          }
        })))
      )).filter(region => region)

      setRegions(regions)
    })()
  }, [])

  return (
    <section>
      <h2>TMDB</h2>
      <p>Sensorr is powered by <a href='https://www.themoviedb.org/' target='_blank' rel='noopener noreferrer'>The Movie Database</a> API, to works properly, you will need to configure a few settings,</p>
      <div sx={{ display: 'flex', flexDirection: 'column' }}>
        <Controller
          name='tmdb'
          control={control}
          rules={{ required: true }}
          render={({ field: { ref, ...field } }) => (
            <Label label='API Key'>
              <input type='text' {...field} sx={{ variant: 'input.default', fontFamily: 'monospace', width: '100%' }} />
            </Label>
          )}
        />
        <small sx={{ disply: 'block', marginTop: 6 }}><a href='https://www.themoviedb.org/signup' target='_blank' rel='noopener noreferrer'>Sign up</a> and fill <a href='https://www.themoviedb.org/settings/api' target='_blank' rel='noopener noreferrer'>your own <code>API Key</code> (v3 auth)</a></small>
      </div>
      <div sx={{ display: 'flex', flexDirection: 'column' }}>
        <Controller
          name='region'
          rules={{ required: true }}
          control={control}
          render={({ field: { ref, ...field } }) => (
            <Label label='Region'>
              <select {...field} sx={{ variant: 'select.default' }}>
                {regions.sort((a, b) => a.name.localeCompare(b.name)).map(region => (
                  <option key={region.country} value={`${region.language}-${region.country}`}>
                    {region.name} {region.emoji}
                  </option>
                ))}
              </select>
            </Label>
          )}
        />
        <small sx={{ disply: 'block', marginTop: 6 }}>Region will be used to show <a href='https://developer.themoviedb.org/docs/languages' target='_blank' rel='noopener noreferrer'>localized data and metadata</a> from TMDB</small>
      </div>
      <div sx={{ display: 'flex', marginTop: 4 }}>
        <Button type='submit' color='primary' sx={{ flex: 1 }}>Save</Button>
      </div>
    </section>
  )
}

const JobsSettings = ({ control, watch, ...props }) => {
  const api = useAPI()
  const { process } = useJobsContext() as any
  const [ongoing, setOngoing] = useState([])

  const runJob = useCallback(async (command) => {
    setOngoing(ongoing => [...ongoing, command])
    const { uri, params, init } = api.query.jobs.runJob({ body: { command } })
    const request = api.fetch(uri, params, init)

    toast.promise(request, {
      loading: `Running new Job "${command}", please wait...`,
      success: (data) => {
        setOngoing(ongoing => ongoing.filter(c => c !== command))
        return `Job "${command}" successfully run (${data.job})`
      },
      error: (err) => {
        console.warn(err)
        setOngoing(ongoing => ongoing.filter(c => c !== command))
        return `Error during Job "${command}" run`
      },
    })
  }, [])

  const stopJob = useCallback(async (command, job) => {
    if (!window.confirm(`Do you really want to stop ${command} job "${job}" ?`)) {
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
    <section>
      <h2>Jobs</h2>
      <p>
        Sensorr schedules background jobs for application operation, use <a href='https://crontab.guru/' target='_blank' rel='noopener noreferrer'>cron</a> syntax to set frequency; use the "play" button to trigger a job manually
      </p>
      {[
        {
          command: 'record',
          emoji: '📹',
          description: 'Record Sensorr wished movies',
          options: ['cron', 'proposalOnly'],
        },
        {
          command: 'doctor',
          emoji: '🚑',
          description: 'Doctor care for archived movies by looking for better releases',
          options: ['cron', 'proposalOnly'],
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
          warning: (
            <span>
              <strong>Warning</strong>, you need to register your Plex server on dedicated "Plex" Settings page first
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
          disabled={ongoing.includes(value.command)}
          runJob={runJob}
          stopJob={stopJob}
          control={control}
          watch={watch}
        />
      ))}
      <div sx={{ display: 'flex', marginTop: 4 }}>
        <Button type='submit' color='primary' sx={{ flex: 1 }}>Save</Button>
      </div>
    </section>
  )
}

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
            type="button"
            sx={JobSettings.styles.run}
            onClick={() => running ? stopJob(command, running.job) : runJob(command)}
            disabled={disabled}
          >
            <Icon value={running ? 'live' : 'play'} height='1em' width='1em' />
          </button>
        </div>
      </div>
      {!!warning && (
        <div sx={{ ...JobSettings.styles.options, borderBottomLeftRadius: '0rem', borderBottomRightRadius: '0rem', backgroundColor: '#FFE9A4', color: '#664D06', paddingX: 4, paddingY: 8 }}>
          {warning}
        </div>
      )}
      {options.includes('cron') && (
        <div sx={JobSettings.styles.options} style={options.includes('proposalOnly') ? { borderBottomLeftRadius: '0rem', borderBottomRightRadius: '0rem' } : {}}>
          <React.Fragment>
            <Controller
              name={`jobs.${command}.paused`}
              control={control}
              render={({ field: { value: checked, onChange } }) => (
                <Option type='checkbox' id={`jobs.${command}.paused`} checked={!checked} onChange={(e: any) => onChange(!e.target.checked)}>
                  <div sx={{ lineHeight: 'normal', paddingY: 10 }}>
                    <strong>{emojize('🤖', 'Scheduled')}</strong>
                    <br/>
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
                }
              }}
              render={({ field: { ref, ...field } }) => (
                <input
                  type='text'
                  {...field}
                  disabled={paused}
                  sx={{
                    variant: 'input.reset',
                    width: 'auto',
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
                  <br/>
                  <small>Won't archive movies with best release, will only propose it, up to you to decide whether to accept or refuse it later</small>
                </div>
              </Option>
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
    marginY: 6,
  },
  container: {
    display: 'flex',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    border: '1px solid',
    borderColor: 'grayDark',
    borderRadius: '0.25rem',
  },
  metadata: {
    display: 'flex',
    alignItems: 'stretch',
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
    },
    '>p': {
      display: 'flex',
      alignItems: 'center',
      marginY: 12,
      marginX: 6,
      padding: 12,
      fontSize: 5,
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
    '>label': {
      flex: 1,
    },
  },
}
