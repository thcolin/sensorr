import { Button, Label } from '@sensorr/ui'
import { useOutletContext } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { useConfigContext } from '../../contexts/Config/Config'
import Body from '../../layout/Body/Body'

const Blackhole = ({ ...props }) => {
  const { onSave } = useOutletContext() as any
  const { config } = useConfigContext()
  const form = useForm({ defaultValues: config.getProperties() })

  return (
    <Body>
      <section>
        <article>
          <h2>Blackhole</h2>
          <p>
            Sensorr will download releases <code>.torrent</code> or <code>.nzb</code> files to your defined blackhole directory, then on your own, configure your download client to watch this directory and automatically download the releases
          </p>
          <form onSubmit={form.handleSubmit(onSave)}>
            <div sx={{ display: 'flex', flexDirection: 'column', paddingY: 8 }}>
              <Controller
                name='blackhole'
                control={form.control}
                rules={{ required: true }}
                disabled={config.get('docker')}
                render={({ field: { ref, ...field } }) => (
                  <Label label='Blackhole directory'>
                    <input type='text' {...field} sx={{ variant: 'input.default', fontFamily: 'monospace', width: '100%' }} required={true} />
                  </Label>
                )}
              />
              {config.get('docker') && (
                <small sx={{ disply: 'block', marginTop: 6 }}>Sensorr is currently running from <strong>Docker</strong> images, to configure blackhole you need to edit your <code>SENSORR_BLACKHOLE</code> environment variable from your <code>.env</code> file</small>
              )}
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

export default Blackhole
