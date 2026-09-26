import React from 'react'
import { Label, Button } from '@sensorr/ui'
import { useOutletContext } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { useConfigContext } from '../../contexts/Config/Config'
import Body from '../../layout/Body/Body'
import { useTitle } from '@sensorr/utils'

const Tautulli = ({ ...props }) => {
  useTitle('Settings - Tautulli')
  const { onSave } = useOutletContext() as any
  const { config } = useConfigContext()
  const form = useForm({ defaultValues: config.getProperties() })

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
      </section>
    </Body>
  )
}

export default Tautulli
