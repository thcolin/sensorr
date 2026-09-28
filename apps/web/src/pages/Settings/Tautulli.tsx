import React from 'react'
import { Label, Button, Option } from '@sensorr/ui'
import { useOutletContext } from 'react-router-dom'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { editionOf, WRAPPED_THEME_NAMES, WRAPPED_TIME_ZONE } from '@sensorr/sensorr'
import { useConfigContext } from '../../contexts/Config/Config'
import Body from '../../layout/Body/Body'
import { useTitle } from '@sensorr/utils'

const Tautulli = ({ ...props }) => {
  useTitle('Settings - Tautulli')
  const { onSave } = useOutletContext() as any
  const { config } = useConfigContext()
  const form = useForm({ defaultValues: config.getProperties() })
  const editions = useFieldArray({ name: 'wrapped.editions', control: form.control })
  const years = form.watch('wrapped.editions').map(({ year }) => year)
  const current = editionOf(Date.now() / 1000, WRAPPED_TIME_ZONE)
  const candidate = years.includes(current) ? Math.max(...years) + 1 : current

  return (
    <Body>
      <section>
        <article>
          <h2>Tautulli</h2>
          <p>Sensorr reads the Plex watch history from <a href='https://tautulli.com/' target='_blank' rel='noopener noreferrer'>Tautulli</a> to compute each friend's wrapped, through the <code>wrapped</code> job.</p>
          <form onSubmit={form.handleSubmit(onSave)}>
            <div sx={{ display: 'flex', flexDirection: 'column', paddingY: 8 }}>
              <Controller
                name='tautulli.url'
                control={form.control}
                rules={{ required: true }}
                render={({ field: { ref, ...field } }) => (
                  <Label label='URL'>
                    <input type='url' {...field} placeholder='http://localhost:8181' sx={{ variant: 'input.default', fontFamily: 'monospace', width: '100%' }} required={true} />
                  </Label>
                )}
              />
            </div>
            <div sx={{ display: 'flex', flexDirection: 'column', paddingY: 8 }}>
              <Controller
                name='tautulli.key'
                control={form.control}
                rules={{ required: true }}
                render={({ field: { ref, ...field } }) => (
                  <Label label='API Key'>
                    <input type='text' {...field} sx={{ variant: 'input.default', fontFamily: 'monospace', width: '100%' }} required={true} />
                  </Label>
                )}
              />
              <small sx={{ marginTop: 6 }}>Found in Tautulli, under <code>Settings</code> › <code>Web Interface</code> › <code>API</code></small>
            </div>
            <div sx={{ display: 'flex', marginTop: 4 }}>
              <Button type='submit' color='primary' sx={{ flex: 1 }}>Save</Button>
            </div>
          </form>
        </article>
        <article>
          <h2>Looks</h2>
          <p>The look each friend's wrapped opens with. An edition can set its own, and a friend's own look, set in <code>Friends</code>, wins over both.</p>
          <form onSubmit={form.handleSubmit(onSave)}>
            <div sx={{ display: 'flex', flexDirection: 'column', paddingY: 8 }}>
              <Controller
                name='wrapped.theme'
                control={form.control}
                render={({ field: { ref, ...field } }) => (
                  <Label label='Look'>
                    <select {...field} sx={{ variant: 'select.default' }}>
                      {Object.entries(WRAPPED_THEME_NAMES).map(([theme, name]) => <option key={theme} value={theme}>{name}</option>)}
                    </select>
                  </Label>
                )}
              />
            </div>
            <div sx={{ display: 'flex', flexDirection: 'column', paddingY: 8 }}>
              <Controller
                name='wrapped.choice'
                control={form.control}
                render={({ field: { value: checked, onChange } }) => (
                  <Option type='checkbox' id='wrapped.choice' checked={checked} onChange={(e: any) => onChange(e.target.checked)}>
                    <div sx={{ lineHeight: 'normal', paddingY: 10 }}>
                      <strong>Friends choose</strong>
                      <br />
                      <small>Each friend can switch to another look on their page, and keeps it on this device</small>
                    </div>
                  </Option>
                )}
              />
            </div>
            <h3>Editions</h3>
            {!editions.fields.length && <p><small>Every edition uses the look above</small></p>}
            {editions.fields.map((edition, index) => (
              <div key={edition.id} sx={Tautulli.styles.edition}>
                <Controller
                  name={`wrapped.editions.${index}.year`}
                  control={form.control}
                  rules={{ required: true, min: 2000, validate: (year) => years.filter((other) => other === Number(year)).length === 1 || 'Already set' }}
                  render={({ field: { ref, value, onChange } }) => (
                    <input type='number' aria-label='Year' min={2000} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} sx={{ variant: 'input.default', fontFamily: 'monospace', width: '100%' }} required={true} />
                  )}
                />
                <Controller
                  name={`wrapped.editions.${index}.theme`}
                  control={form.control}
                  render={({ field: { ref, value, onChange } }) => (
                    <select aria-label='Look' value={value ?? ''} onChange={(e) => onChange(e.target.value || null)} sx={{ variant: 'select.default' }}>
                      <option value=''>Global look</option>
                      {Object.entries(WRAPPED_THEME_NAMES).map(([theme, name]) => <option key={theme} value={theme}>{name}</option>)}
                    </select>
                  )}
                />
                <Controller
                  name={`wrapped.editions.${index}.choice`}
                  control={form.control}
                  render={({ field: { ref, value, onChange } }) => (
                    <select aria-label='Friends choose' value={value === null || value === undefined ? '' : String(value)} onChange={(e) => onChange(e.target.value === '' ? null : e.target.value === 'true')} sx={{ variant: 'select.default' }}>
                      <option value=''>Global choice</option>
                      <option value='true'>Friends choose</option>
                      <option value='false'>Look fixed</option>
                    </select>
                  )}
                />
                <Button type='button' color='error' variant='outline' onClick={() => editions.remove(index)} aria-label={`Remove the ${form.watch(`wrapped.editions.${index}.year`)} edition`}>Remove</Button>
              </div>
            ))}
            <div sx={{ display: 'flex', marginTop: 4, gap: 4 }}>
              <Button type='button' variant='outline' sx={{ flex: 1 }} onClick={() => editions.append({ year: candidate, theme: null, choice: null })}>
                Add edition {candidate}
              </Button>
              <Button type='submit' color='primary' sx={{ flex: 1 }}>Save</Button>
            </div>
          </form>
        </article>
      </section>
    </Body>
  )
}

Tautulli.styles = {
  edition: {
    display: 'grid',
    gridTemplateColumns: ['1fr 1fr', '6rem 1fr 1fr auto'],
    alignItems: 'center',
    gap: 4,
    paddingY: 8,
    borderBottom: '1px solid',
    borderColor: 'grayDark',
    '>input, >button': {
      gridColumn: ['1 / -1', 'auto'],
    },
  },
}

export default Tautulli
