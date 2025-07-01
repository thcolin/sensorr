import React, { useCallback, useEffect, useState } from 'react'
import { Option, Button, Label } from '@sensorr/ui'
import { Znab } from '@sensorr/sensorr'
import { useOutletContext } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { useConfigContext } from '../../contexts/Config/Config'
import { useAPI } from '../../store/api'

const Znabs = ({ ...props }) => {
  const { onSave } = useOutletContext() as any
  const { config } = useConfigContext()
  const form = useForm({
    defaultValues: {
      ...config.getProperties(),
      znabs: (config.get('znabs') || []).map(znab => ({ ...znab, oldName: znab.name })),
    },
  })
  const znabs = useFieldArray({ name: 'znabs', control: form.control })
  const znab = useForm({ defaultValues: { name: '', url:'', key:'' } })

  const onAppend = useCallback((values) => {
    znabs.append(values)
    znab.reset()
  }, [znabs.append, znab.reset])

  return (
    <section>
      <article>
        <h2>Indexers</h2>
        <p>Sensorr use <strong>Indexer Proxy</strong> (like <a href='https://github.com/Jackett/Jackett' target='_blank' rel='noopener noreferrer'>Jackett</a> and <a href='https://github.com/Prowlarr/Prowlarr' target='_blank' rel='noopener noreferrer'>Prowlarr</a>) which offers a standardized API (<a href='https://torznab.github.io/spec-1.3-draft/index.html' target='_blank' rel='noopener noreferrer'>Torznab</a>) to search for releases on your favorite torrent trackers or usenest indexers, add and configure indexers you want to use</p>
        <form onSubmit={znab.handleSubmit(onAppend)}>
          <div sx={{ display: 'flex', flexDirection: 'column', paddingTop: 8 }}>
            <ZnabSettings form={znab} behavior='create' />
          </div>
        </form>
        <ul sx={{ listStyleType: 'none', padding: 12, margin: 12, '>li': { paddingBottom: 8, lineHeight: '1 !important' } }}>
          <li>
            <small><strong>Jackett</strong>, use <code>Torznab Feed</code> of your favorite indexers and your <code>API Key</code> displayed in your home page</small>
          </li>
          <li>
            <small><strong>Prowlarr</strong>, use <code>Torznab Url</code> of your favorite indexers and your <code>API Key</code> from <code>Settings &#x3E; General &#x3E; Security</code> section</small>
          </li>
        </ul>
        <hr sx={{ variant: 'hr.default', marginY: 6, marginX: '25%' }}></hr>
        <form onSubmit={form.handleSubmit(onSave)}>
          <div sx={{ display: 'flex', flexDirection: 'column', paddingY: 8 }}>
            {znabs.fields.map((znab: any, index) => (
              <ZnabSettings key={znab.id} form={form} prefix={`znabs[${index}]`} index={index} remove={znabs.remove} />
            ))}
          </div>
          <div sx={{ display: 'flex', marginTop: 4 }}>
            <Button type='submit' color='primary' sx={{ flex: 1 }}>Save</Button>
          </div>
        </form>
      </article>
    </section>
  )
}

const ZnabSettings = ({ form, prefix = undefined, index = null, behavior = 'default', remove = null, ...props }) => {
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
        loading: `Testing indexer **${name}** operability...`,
        success: () => {
          const latency = Math.round(performance.now() - start)
          setOperable(true)
          setLatency(latency)
          setLoading(false)
          return `Indexer **${name}** operationnal ! (${latency > 1000 ? `${(latency / 1000).toFixed(0)}s` : `${latency}ms`})`
        },
        error: (err) => {
          setOperable(false)
          setError(err.toString())
          console.warn(err)
          setLoading(false)
          return `Unable to connect to indexer **${name}**`
        },
      }
    )
  }, [api.access_token])

  useEffect(() => {
    if (behavior !== 'default') {
      return
    }

    test({ name: values.name, url: values.url, key: values.key }, true)
  }, [])

  return (
    <div sx={ZnabSettings.styles.element}>
      <div sx={ZnabSettings.styles.container} data-disabled={values.disabled}>
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
                  title={values.disabled ? 'Enable indexer' : 'Disable indexer'}
                />
              )}
            />
            <button
              type='button'
              sx={{ ...ZnabSettings.styles.button, ...ZnabSettings.styles.test }}
              onClick={() => test({ url: values.url, name: values.name, key: values.key })}
              title='Test indexer operability'
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
                      znab: (policy.prefer || {}).znab?.map((value) => value === values.oldName ? e.target.value : value) || [],
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
              placeholder='Name'
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
              placeholder='URL'
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
              placeholder='API Key'
              disabled={values.disabled}
              required={true}
            />
          )}
        />
        {behavior === 'default' && (
          <button
            type='button'
            sx={{ ...ZnabSettings.styles.button, ...ZnabSettings.styles.remove }}
            onClick={() => {
              if (confirm('Do you really want to delete this Indexer? All references to this indexer in policies will be removed')) {
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
                      znab: (policy.prefer || {}).znab?.filter((value) => value !== values.oldName) || [],
                    },
                    avoid: {
                      ...(policy.avoid || {}),
                      znab: (policy.avoid || {}).znab?.filter((value) => value !== values.oldName) || [],
                    },
                  })),
                )
              }
            }}
            title='Remove indexer'
          >
            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' style={{ transform: 'rotate(45deg)' }}>
              <path fill='currentColor' d='M24 10h-10v-10h-4v10h-10v4h10v10h4v-10h10z' />
            </svg>
          </button>
        )}
        {behavior === 'create' && (
          <button type='submit' sx={{ ...ZnabSettings.styles.button, ...ZnabSettings.styles.add }} title='Add indexer'>
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
  container: {
    display: 'flex',
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
      borderBottomLeftRadius: '0.25rem !important',
    },
    '>*:last-child': {
      borderTopRightRadius: '0.25rem !important',
      borderBottomRightRadius: '0.25rem !important',},
    '>label': {
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
      marginRight: '-1px',
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
  test: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingX: 2,
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
    whiteSpace: 'nowrap',
  },
}

export default Znabs
