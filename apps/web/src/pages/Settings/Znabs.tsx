import React, { useCallback, useEffect, useState } from 'react'
import { Option, Button, Label } from '@sensorr/ui'
import { Znab, ranked, unranked } from '@sensorr/sensorr'
import { useOutletContext } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Trans, useTranslation } from 'react-i18next'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { useConfigContext } from '../../contexts/Config/Config'
import { useAPI } from '../../store/api'
import Body from '../../layout/Body/Body'
import { useTitle } from '@sensorr/utils'

export const znabsOf = (config) => (config.get('znabs') || []).map(znab => ({ ...znab, oldName: znab.name }))

export const ZnabsFields = ({ form, onSubmit, children, guard = false }) => {
  const { t } = useTranslation()
  const znabs = useFieldArray({ name: 'znabs', control: form.control })
  const znab = useForm({ defaultValues: { name: '', url:'', key:'' } })

  const onAppend = useCallback((values) => {
    znabs.append(values)
    znab.reset()
  }, [znabs.append, znab.reset])

  return (
    <>
      <form onSubmit={znab.handleSubmit(onAppend)}>
        <div sx={{ display: 'flex', flexDirection: 'column', paddingTop: 8 }}>
          <ZnabSettings form={znab} behavior='create' />
        </div>
      </form>
      <ul sx={{ listStyleType: 'none', padding: 12, margin: 12, '>li': { paddingBottom: 8, lineHeight: '1 !important' } }}>
        <li>
          <small><Trans t={t} i18nKey='settings.znabs.jackett' components={[<strong />, <code />, <code />]} /></small>
        </li>
        <li>
          <small><Trans t={t} i18nKey='settings.znabs.prowlarr' components={[<strong />, <code />, <code />, <code />]} /></small>
        </li>
      </ul>
      <hr sx={{ variant: 'hr.default', marginY: 6, marginX: '25%' }}></hr>
      <form onSubmit={form.handleSubmit((values) => (guard && Object.values(znab.getValues()).some(Boolean)) ? toast.error(t('settings.znabs.pending')) : onSubmit(values))}>
        <div sx={{ display: 'flex', flexDirection: 'column', paddingY: 8 }}>
          {znabs.fields.map((znab: any, index) => (
            <ZnabSettings key={znab.id} form={form} prefix={`znabs[${index}]`} index={index} remove={znabs.remove} />
          ))}
        </div>
        {children}
      </form>
    </>
  )
}

export const ZnabsIntro = () => {
  const { t } = useTranslation()
  return <Trans t={t} i18nKey='settings.znabs.intro' components={[<strong />, <a href='https://github.com/Jackett/Jackett' target='_blank' rel='noopener noreferrer' />, <a href='https://github.com/Prowlarr/Prowlarr' target='_blank' rel='noopener noreferrer' />, <a href='https://torznab.github.io/spec-1.3-draft/index.html' target='_blank' rel='noopener noreferrer' />]} />
}

const Znabs = ({ ...props }) => {
  const { t } = useTranslation()
  useTitle(t('settings.documentTitle', { page: t('settings.sections.indexers') }))
  const { onSave } = useOutletContext() as any
  const { config } = useConfigContext()
  const form = useForm({
    defaultValues: {
      ...config.getProperties(),
      znabs: znabsOf(config),
    },
  })

  return (
    <Body>
      <section>
        <article>
          <h2>{t('settings.sections.indexers')}</h2>
          <p><ZnabsIntro /></p>
          <ZnabsFields form={form} onSubmit={onSave}>
            <div sx={{ display: 'flex', marginTop: 4 }}>
              <Button type='submit' color='primary' sx={{ flex: 1 }}>{t('settings.save.label')}</Button>
            </div>
          </ZnabsFields>
        </article>
      </section>
    </Body>
  )
}

const ZnabSettings = ({ form, prefix = undefined, index = null, behavior = 'default', remove = null, ...props }) => {
  const { t } = useTranslation()
  const api = useAPI()
  const { config } = useConfigContext()
  const values = form.watch(prefix)

  const [loading, setLoading] = useState(true)
  const [operable, setOperable] = useState(false)
  const [error, setError] = useState(null)
  const [latency, setLatency] = useState(null)

  const test = useCallback(async ({ name, url, key }, silent = false) => {
    setLoading(true)
    setLatency(null)
    setError(null)
    const znab = new Znab({ name, url, key, disabled: false }, { proxify: true })
    const start = performance.now()

    if (silent) {
      try {
        await znab.search('abc', {
          headers: {
            Authorization: `Bearer ${api.access_token}`,
          }
        })
        setOperable(true)
        setLatency(Number(performance.now() - start))
        setLoading(false)
      } catch (err) {
        setOperable(false)
        setError(err.toString())
        console.warn(err)
      } finally {
        setLoading(false)
      }

      return
    }

    toast.promise(
      znab.search('abc', {
        headers: {
          Authorization: `Bearer ${api.access_token}`,
        }
      }),
      {
        loading: t('settings.znabs.test.loading', { name }),
        success: () => {
          const latency = Math.round(performance.now() - start)
          setOperable(true)
          setLatency(latency)
          setLoading(false)
          return t('settings.znabs.test.success', { name, latency: latency > 1000 ? `${(latency / 1000).toFixed(0)}s` : `${latency}ms` })
        },
        error: (err) => {
          setOperable(false)
          setError(err.toString())
          console.warn(err)
          setLoading(false)
          return t('settings.znabs.test.error', { name })
        },
      }
    )
  }, [api.access_token, t])

  useEffect(() => {
    if (behavior !== 'default') {
      return
    }

    test({ name: values.name, url: values.url, key: values.key }, true)
  }, [])

  return (
    <div sx={ZnabSettings.styles.element}>
      <div sx={ZnabSettings.styles.container} data-disabled={values.disabled} data-behavior={behavior}>
        {behavior === 'default' && (
          <React.Fragment>
            <Controller
              name={`${prefix ? `${prefix}.` : ''}disabled`}
              control={form.control}
              render={({ field: { value: checked, onChange } }) => (
                <Option
                  type='checkbox'
                  id={`${prefix ? `${prefix}.` : ''}disabled`}
                  behavior='toggle'
                  borderless={true}
                  checked={!checked}
                  onChange={(e: any) => onChange(!e.target.checked)}
                  title={values.disabled ? t('settings.znabs.enable') : t('settings.znabs.disable')}
                />
              )}
            />
            <button
              type='button'
              sx={{ ...ZnabSettings.styles.button, ...ZnabSettings.styles.test }}
              style={{ gridArea: 'test' }}
              onClick={() => test({ url: values.url, name: values.name, key: values.key })}
              title={t('settings.znabs.test.title')}
              disabled={values.disabled}
            >
              <i sx={{ backgroundColor: values.disabled ? 'grayDarker' : loading ? 'warning' : operable ? 'success' : 'error' }}></i>
              {operable && !values.disabled && latency && (
                <span>{latency > 1000 ? `${(latency / 1000).toFixed(0)}s` : `${latency}ms`}</span>
              )}
            </button>
          </React.Fragment>
        )}
        <Controller
          name={`${prefix ? `${prefix}.` : ''}name`}
          control={form.control}
          render={({ field: { ref, ...field } }) => (
            <input
              type='text'
              {...field}
              onChange={(e) => {
                form.setValue(
                  'policies',
                  (config.get('policies') || []).map((policy) => ({
                    ...policy,
                    require: {
                      ...(policy.require || {}),
                      znab: (policy.require || {}).znab?.map((value) => value === values.oldName ? e.target.value : value) || [],
                    },
                    prefer: {
                      ...(policy.prefer || {}),
                      znab: ranked(unranked((policy.prefer || {}).znab).map((item) => item.value === values.oldName ? { ...item, value: e.target.value } : item)),
                    },
                    avoid: {
                      ...(policy.avoid || {}),
                      znab: (policy.avoid || {}).znab?.map((value) => value === values.oldName ? e.target.value : value) || [],
                    },
                  })),
                )

                field.onChange(e.target.value)
              }}
              sx={{ variant: 'input.default', flex: 1, fontFamily: 'monospace', width: '100%' }}
              style={{ gridArea: 'name' }}
              placeholder={t('settings.znabs.name')}
              disabled={values.disabled}
              required={true}
            />
          )}
        />
        <Controller
          name={`${prefix ? `${prefix}.` : ''}url`}
          control={form.control}
          render={({ field: { ref, ...field } }) => (
            <input
              type='url'
              {...field}
              sx={{ variant: 'input.default', flex: 4, fontFamily: 'monospace', width: '100%' }}
              style={{ gridArea: 'url' }}
              placeholder={t('settings.znabs.url')}
              disabled={values.disabled}
              required={true}
            />
          )}
        />
        <Controller
          name={`${prefix ? `${prefix}.` : ''}key`}
          control={form.control}
          render={({ field: { ref, ...field } }) => (
            <input
              type='text'
              {...field}
              sx={{ variant: 'input.default', flex: 2, fontFamily: 'monospace', width: '100%' }}
              style={{ gridArea: 'key' }}
              placeholder={t('settings.znabs.key')}
              disabled={values.disabled}
              required={true}
            />
          )}
        />
        {behavior === 'default' && (
          <button
            type='button'
            sx={{ ...ZnabSettings.styles.button, ...ZnabSettings.styles.remove }}
            style={{ gridArea: 'remove' }}
            onClick={() => {
              if (window.confirm(t('settings.znabs.remove.confirm'))) {
                remove(index)
                form.setValue(
                  'policies',
                  (config.get('policies') || []).map((policy) => ({
                    ...policy,
                    require: {
                      ...(policy.require || {}),
                      znab: (policy.require || {}).znab?.filter((value) => value !== values.oldName) || [],
                    },
                    prefer: {
                      ...(policy.prefer || {}),
                      znab: ranked(unranked((policy.prefer || {}).znab).filter((item) => item.value !== values.oldName)),
                    },
                    avoid: {
                      ...(policy.avoid || {}),
                      znab: (policy.avoid || {}).znab?.filter((value) => value !== values.oldName) || [],
                    },
                  })),
                )
              }
            }}
            title={t('settings.znabs.remove.title')}
          >
            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' style={{ transform: 'rotate(45deg)' }}>
              <path fill='currentColor' d='M24 10h-10v-10h-4v10h-10v4h10v10h4v-10h10z' />
            </svg>
          </button>
        )}
        {behavior === 'create' && (
          <button type='submit' sx={{ ...ZnabSettings.styles.button, ...ZnabSettings.styles.add }} style={{ gridArea: 'add' }} title={t('settings.znabs.add')}>
            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
              <path fill='currentColor' d='M24 10h-10v-10h-4v10h-10v4h10v10h4v-10h10z' />
            </svg>
          </button>
        )}
      </div>
      {error && !values.disabled && <div sx={ZnabSettings.styles.error}>{error}</div>}
    </div>
  )
}

ZnabSettings.styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    marginY: 6,
  },
  // One row on a desktop; a card on a phone, the name on top, the URL and the key at full width under it
  container: {
    display: ['grid', 'flex'],
    gridTemplateColumns: 'auto auto minmax(0, 1fr) auto',
    gridTemplateAreas: `"toggle test name remove" "url url url url" "key key key key"`,
    '&[data-behavior="create"]': {
      gridTemplateAreas: `"name name name add" "url url url url" "key key key key"`,
    },
    alignItems: 'stretch',
    position: 'relative',
    '>*': {
      borderTopLeftRadius: '0rem !important',
      borderBottomLeftRadius: '0rem !important',
      borderTopRightRadius: '0rem !important',
      borderBottomRightRadius: '0rem !important',
    },
    '>*:first-child': {
      borderTopLeftRadius: '0.25rem !important',
      borderBottomLeftRadius: ['0rem !important', '0.25rem !important'],
    },
    '>*:last-child': {
      borderTopRightRadius: '0.25rem !important',
      borderBottomRightRadius: ['0rem !important', '0.25rem !important'],
    },
    '>input:last-of-type': {
      borderBottomLeftRadius: ['0.25rem !important', '0rem !important'],
      borderBottomRightRadius: ['0.25rem !important', '0rem !important'],
    },
    '>label': {
      gridArea: 'toggle',
      border: '1px solid',
      borderColor: 'grayDark',
      borderRight: 'none',
      margin: 12,
      paddingX: 8,
      ':hover': {
        backgroundColor: 'grayLight',
      },
    },
    '>input': {
      zIndex: 0,
      '&:hover,&:focus,&:active': {
        zIndex: 1,
      },
    },
    '>input:not(:last-of-type)': {
      marginRight: ['0px', '-1px'],
    },
    '>input[type="url"], >input[type="url"] ~ input': {
      marginTop: ['-1px', '0px'],
    },
    '&[data-disabled="true"] >label': {
      borderColor: 'gray',
    },
  },
  button: {
    variant: 'button.reset',
    borderRadius: '0.25em',
    paddingX: 6,
    '>svg': {
      height: '0.75em',
      width: '0.75em',
    },
  },
  // Wide enough for `999ms`, with or without it, so the inputs line up from one row to the next.
  test: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '6.5em',
    border: '1px solid',
    borderRight: '0px',
    borderColor: 'grayDark',
    fontFamily: 'monospace',
    fontSize: 7,
    '&:hover:not(:disabled)': {
      backgroundColor: 'grayLight',
    },
    '&:active:not(:disabled)': {
      backgroundColor: 'gray',
    },
    '&:disabled': {
      borderColor: 'gray',
      color: 'grayDarker',
    },
    '>i': {
      display: 'block',
      height: '0.5em',
      width: '0.5em',
      borderRadius: '50%',
    },
    '>span': {
      marginLeft: 3,
    },
  },
  remove: {
    backgroundColor: 'error',
    color: 'whitePure',
    '&:hover': {
      backgroundColor: 'errorDarker',
    },
    '&:active': {
      backgroundColor: 'errorDarkest',
    },
  },
  add: {
    backgroundColor: 'accent',
    color: 'whitePure',
    '&:hover': {
      backgroundColor: 'accentDarker',
    },
    '&:active': {
      backgroundColor: 'accentDarkest',
    },
  },
  error: {
    backgroundColor: '#ffa4a4',
    marginTop: 6,
    paddingX: 4,
    paddingY: 8,
    color: '#660606',
    border: '1px solid #660606',
    borderRadius: '0.25em',
    fontFamily: 'monospace',
    fontSize: 5,
    overflowX: 'auto',
    overflowY: 'hidden',
    whiteSpace: 'nowrap',
  },
}

export default Znabs
