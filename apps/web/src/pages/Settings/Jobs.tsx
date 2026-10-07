import React from 'react'
import { Option, Icon, Button, Link } from '@sensorr/ui'
import { emojize, useTitle } from '@sensorr/utils'
import { JOB_EMOJIS, jobTitleOf } from '@sensorr/sensorr'
import { useOutletContext } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { CronExpressionParser } from 'cron-parser'
import cronstrue from 'cronstrue'
import 'cronstrue/locales/fr'
import { Trans, useTranslation } from 'react-i18next'
import { useConfigContext } from '../../contexts/Config/Config'
import { useJobsContext } from '../../contexts/Jobs/Jobs'
import Body from '../../layout/Body/Body'
import { JOB_GROUPS, nameOfEntry, useJobRunner } from '../../components/Sensorr/Jobs'

export const JobsFields = ({ form, compact = false }) => {
  const { t } = useTranslation()
  const { config } = useConfigContext()
  const { process } = useJobsContext() as any
  const { runJob, stopJob, ongoing } = useJobRunner()

  const plex = {
    disabled: !config.get('plex.token'),
    warning: config.get('plex.token') ? null : (
      <span sx={{ '>a': { color: 'warningDark', ':hover:not(:disabled)': { color: 'warningDarker' }, ':active': { color: 'warningDarkest' } } }}>
        <Trans t={t} i18nKey='settings.jobs.requires.plex' components={[<strong />, <Link to='/settings/plex' />]} />
      </span>
    ),
  }

  const tautulli = {
    disabled: !config.get('tautulli.url'),
    warning: config.get('tautulli.url') ? null : (
      <span sx={{ '>a': { color: 'warningDark', ':hover:not(:disabled)': { color: 'warningDarker' }, ':active': { color: 'warningDarkest' } } }}>
        <Trans t={t} i18nKey='settings.jobs.requires.tautulli' components={[<strong />, <Link to='/settings/tautulli' />]} />
      </span>
    ),
  }

  const mailable = !!(config.get('mail.host') && config.get('mail.from') && config.get('mail.url'))
  const mail = {
    disabled: !mailable,
    warning: mailable ? null : (
      <span sx={{ '>a': { color: 'warningDark', ':hover:not(:disabled)': { color: 'warningDarker' }, ':active': { color: 'warningDarkest' } } }}>
        <Trans t={t} i18nKey='settings.jobs.requires.mail' components={[<strong />, <Link to='/settings/mail' />]} />
      </span>
    ),
  }

  const requirements = { 'plex.token': plex, 'tautulli.url': tautulli, 'mail.host': mail }

  return (
    <>
      {JOB_GROUPS.map(({ label, jobs }) => (
        <React.Fragment key={label}>
          <h3>{label}</h3>
          {jobs.map((value) => (
            <JobSettings
              key={nameOfEntry(value)}
              {...value}
              {...requirements[value.requires]}
              running={Object.values(process).find((p: any) => p.command === value.command && p.type === value.type)}
              disabled={!!requirements[value.requires]?.disabled || ongoing.includes(nameOfEntry(value))}
              runJob={runJob}
              stopJob={stopJob}
              control={form.control}
              watch={form.watch}
              compact={compact}
            />
          ))}
        </React.Fragment>
      ))}
    </>
  )
}

const JobsSettings = ({ ...props }) => {
  const { t } = useTranslation()
  useTitle(t('settings.documentTitle', { page: t('settings.sections.schedule') }))
  const { config } = useConfigContext()
  const { onSave } = useOutletContext() as any
  const form = useForm({ defaultValues: config.getProperties() })

  return (
    <Body>
      <section sx={JobsSettings.styles.element}>
        <article>
          <h2>{t('settings.jobs.lifecycle.title')}</h2>
          <p sx={{ paddingBottom: 4 }}>
            <Trans t={t} i18nKey='settings.jobs.lifecycle.record' components={[<code />, <code />, <code />]} />
          </p>
          <p sx={{ paddingBottom: 4 }} style={{ lineHeight: 2 }}>
            <Trans t={t} i18nKey='settings.jobs.lifecycle.refine' components={[<code />, <code />, <code />, <code />, <code />, <code />, <code />, <code />]} />
          </p>
          <p sx={{ paddingBottom: 4 }}>
            <Trans t={t} i18nKey='settings.jobs.lifecycle.pinned' components={[<code />, <code />]} />
          </p>
          <p sx={{ paddingBottom: 4 }} style={{ lineHeight: 2 }}>
            <Trans t={t} i18nKey='settings.jobs.lifecycle.shows' components={[<code />, <code />, <code />, <code />, <code />]} />
          </p>
          <h2>{t('settings.sections.schedule')}</h2>
          <p>
            <Trans t={t} i18nKey='settings.jobs.intro' components={[<a href='https://crontab.guru/' target='_blank' rel='noopener noreferrer' />]} />
          </p>
        </article>
        <article>
          <form onSubmit={form.handleSubmit(onSave)} >
            <JobsFields form={form} />
            <div sx={{ display: 'flex', marginTop: 4 }}>
              <Button type='submit' color='primary' sx={{ flex: 1 }}>{t('settings.save.label')}</Button>
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

const JobSettings = ({ command, type = undefined, description, warning = null, options, running, runJob, stopJob, control, watch, disabled = false, compact = false, ...props }) => {
  const { t, i18n } = useTranslation()
  const name = [command, type].filter(Boolean).join(' ')
  const emoji = JOB_EMOJIS[name]
  const key = ['jobs', command, type].filter(Boolean).join('.')
  const cronValue = watch(`${key}.cron`)
  const paused = watch(`${key}.paused`)

  let cronString = ''

  try {
    CronExpressionParser.parse(cronValue)
    cronString = cronstrue.toString(cronValue, {
      throwExceptionOnParseError: true,
      use24HourTimeFormat: true,
      verbose: true,
      locale: i18n.language,
    })
  } catch (e) {
    cronString = t('settings.jobs.invalid')
  }

  return (
    <div sx={JobSettings.styles.element}>
      <div sx={JobSettings.styles.container}>
        <div sx={JobSettings.styles.metadata}>
          <h5>{emojize(emoji, command)}</h5>
          <p>{description}</p>
        </div>
        {compact && (
          <Controller
            name={`${key}.paused`}
            control={control}
            render={({ field: { value: checked, onChange } }) => (
              <Option type='checkbox' id={`${key}.paused`} checked={!checked} onChange={(e: any) => onChange(!e.target.checked)} title={checked ? t('settings.jobs.paused') : cronString}>
                <small sx={{ whiteSpace: ['normal', 'nowrap'], paddingRight: 4 }}>{checked ? t('settings.jobs.paused') : cronString}</small>
              </Option>
            )}
          />
        )}
        {!compact && <div sx={{ display: 'flex' }}>
          <button
            type='button'
            sx={JobSettings.styles.run}
            aria-label={running ? t('settings.jobs.stop', { job: jobTitleOf(name) }) : t('settings.jobs.run', { job: jobTitleOf(name) })}
            title={running ? t('settings.jobs.stop', { job: jobTitleOf(name) }) : t('settings.jobs.run', { job: jobTitleOf(name) })}
            onClick={() => (running ? stopJob(name, running.job) : runJob(command, type))}
            disabled={disabled}
          >
            <Icon value={running ? 'live' : 'play'} height='1em' width='1em' />
          </button>
        </div>}
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
      {!compact && options.includes('cron') && (
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
                    <strong>{emojize('🤖', t('settings.jobs.scheduled'))}</strong>
                    <br />
                    <small>{paused ? t('settings.jobs.paused') : cronString}</small>
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
                    CronExpressionParser.parse(value)
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
      {!compact && options.includes('proposalOnly') && (
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
                  <strong>{emojize('🛎', t('settings.jobs.proposalOnly.label'))}</strong>
                  <br />
                  <small>
                    <Trans t={t} i18nKey='settings.jobs.proposalOnly.help' components={[<strong />]} />
                  </small>
                </div>
              </Option>
            )}
          />
        </div>
      )}
      {!compact && options.includes('cleanup') && (
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
                  <strong>{emojize('🧹', t('settings.jobs.cleanup.label'))}</strong>
                  <br />
                  <small>
                    <Trans t={t} i18nKey='settings.jobs.cleanup.help' components={[<strong />]} />
                  </small>
                </div>
              </Option>
            )}
          />
        </div>
      )}
      {!compact && options.includes('threshold') && (
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
                  <strong>{emojize('📦', t('settings.jobs.threshold.label'))}</strong>
                  <br />
                  <small>{t('settings.jobs.threshold.help')}</small>
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
                <div>{t('settings.jobs.threshold.unit')}</div>
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
