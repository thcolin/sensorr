import { Button, Label, Option } from '@sensorr/ui'
import { useOutletContext } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { useConfigContext } from '../../contexts/Config/Config'
import Body from '../../layout/Body/Body'
import { emojize, useTitle } from '@sensorr/utils'

export const BlackholeIntro = () => (
  <>Sensorr will download releases <code>.torrent</code> or <code>.nzb</code> files, and the <code>.magnet</code> files of movies once turned on below, to your defined blackhole directory, then on your own, configure your download client to watch this directory and automatically download the releases</>
)

export const BlackholeFields = ({ form, compact = false }) => {
  const { config } = useConfigContext()

  return (
    <>
      <h3>Movies</h3>
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
          <small sx={{ display: 'block', marginTop: 6 }}>Sensorr is currently running from <strong>Docker</strong> images, to configure blackhole you need to edit your <code>SENSORR_BLACKHOLE</code> environment variable from your <code>.env</code> file</small>
        )}
      </div>
      <div sx={{ paddingBottom: 8 }}>
        <Controller
          name='magnet'
          control={form.control}
          render={({ field: { value: checked, onChange } }) => (
            <Option type='checkbox' id='magnet' checked={checked} onChange={(e: any) => onChange(e.target.checked)}>
              <div sx={{ lineHeight: 'normal', paddingY: 10 }}>
                <strong>{emojize('🧲', 'Magnet links')}</strong>
                <br />
                <small>Your download client has to read <code>.magnet</code> files from its watched folder: qBittorrent does, Transmission does not. Off, a release an indexer only has as a magnet link is withdrawn</small>
              </div>
            </Option>
          )}
        />
      </div>
      {compact ? (
        <details sx={{ marginTop: 6, '>summary': { cursor: 'pointer', fontWeight: 'semibold', paddingY: 8 } }}>
          <summary>Shows</summary>
          <p>
            Shows <code>.torrent</code> files go to their own blackhole, and a show release that only has a magnet link is withdrawn. Your download client saves their files to the staging directory, from where Sensorr hard links the wanted episodes into the library: all three must sit on the same mount
          </p>
          <div sx={{ display: 'flex', flexDirection: 'column', paddingY: 8, gap: 6 }}>
            {[
              { name: 'shows.blackhole', label: 'Blackhole directory' },
              { name: 'shows.staging', label: 'Staging directory' },
              { name: 'shows.library', label: 'Library directory' },
            ].map(({ name, label }) => (
              <Controller
                key={name}
                name={name}
                control={form.control}
                rules={{ required: true }}
                disabled={config.get('docker')}
                render={({ field: { ref, ...field } }) => (
                  <Label label={label}>
                    <input type='text' {...field} sx={{ variant: 'input.default', fontFamily: 'monospace', width: '100%' }} required={true} />
                  </Label>
                )}
              />
            ))}
            {config.get('docker') && (
              <small sx={{ display: 'block' }}>Sensorr is currently running from <strong>Docker</strong> images, the shows directories live under <code>/tvshows</code>: to move them, edit your <code>SENSORR_TVSHOWS</code> environment variable from your <code>.env</code> file</small>
            )}
          </div>
        </details>
      ) : (
        <>
          <h3>Shows</h3>
          <p>
            Shows <code>.torrent</code> files go to their own blackhole, and a show release that only has a magnet link is withdrawn. Your download client saves their files to the staging directory, from where Sensorr hard links the wanted episodes into the library: all three must sit on the same mount
          </p>
          <div sx={{ display: 'flex', flexDirection: 'column', paddingY: 8, gap: 6 }}>
            {[
              { name: 'shows.blackhole', label: 'Blackhole directory' },
              { name: 'shows.staging', label: 'Staging directory' },
              { name: 'shows.library', label: 'Library directory' },
            ].map(({ name, label }) => (
              <Controller
                key={name}
                name={name}
                control={form.control}
                rules={{ required: true }}
                disabled={config.get('docker')}
                render={({ field: { ref, ...field } }) => (
                  <Label label={label}>
                    <input type='text' {...field} sx={{ variant: 'input.default', fontFamily: 'monospace', width: '100%' }} required={true} />
                  </Label>
                )}
              />
            ))}
            {config.get('docker') && (
              <small sx={{ display: 'block' }}>Sensorr is currently running from <strong>Docker</strong> images, the shows directories live under <code>/tvshows</code>: to move them, edit your <code>SENSORR_TVSHOWS</code> environment variable from your <code>.env</code> file</small>
            )}
          </div>
        </>
      )}
    </>
  )
}

const Blackhole = ({ ...props }) => {
  useTitle('Settings - Blackhole')
  const { onSave } = useOutletContext() as any
  const { config } = useConfigContext()
  const form = useForm({ defaultValues: config.getProperties() })

  return (
    <Body>
      <section>
        <article>
          <h2>Blackhole</h2>
          <p>
            <BlackholeIntro />
          </p>
          <form onSubmit={form.handleSubmit(onSave)}>
            <BlackholeFields form={form} />
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
