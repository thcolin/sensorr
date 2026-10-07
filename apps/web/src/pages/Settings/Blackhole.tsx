import { Button, Label, Option } from '@sensorr/ui'
import { useOutletContext } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import { Controller, useForm } from 'react-hook-form'
import { useConfigContext } from '../../contexts/Config/Config'
import Body from '../../layout/Body/Body'
import { emojize, useTitle } from '@sensorr/utils'

export const BlackholeIntro = () => {
  const { t } = useTranslation()
  return <Trans t={t} i18nKey='settings.blackhole.intro' components={[<code />, <code />, <code />]} />
}

export const BlackholeFields = ({ form, compact = false }) => {
  const { t } = useTranslation()
  const { config } = useConfigContext()
  const docker = config.get('docker')
  const directories = [
    { name: 'shows.blackhole', label: t('settings.blackhole.directory') },
    { name: 'shows.staging', label: t('settings.blackhole.shows.staging') },
    { name: 'shows.library', label: t('settings.blackhole.shows.library') },
  ]

  const shows = (
    <>
      <p>
        <Trans t={t} i18nKey='settings.blackhole.shows.intro' components={[<code />]} />
      </p>
      <div sx={{ display: 'flex', flexDirection: 'column', paddingY: 8, gap: 6 }}>
        {directories.map(({ name, label }) => (
          <Controller
            key={name}
            name={name}
            control={form.control}
            rules={{ required: true }}
            disabled={docker}
            render={({ field: { ref, ...field } }) => (
              <Label label={label}>
                <input type='text' {...field} sx={{ variant: 'input.default', fontFamily: 'monospace', width: '100%' }} required={true} />
              </Label>
            )}
          />
        ))}
        {docker && (
          <small sx={{ display: 'block' }}><Trans t={t} i18nKey='settings.blackhole.shows.docker' components={[<strong />, <code />, <code />, <code />]} /></small>
        )}
      </div>
    </>
  )

  return (
    <>
      <h3>{t('settings.blackhole.movies')}</h3>
      <div sx={{ display: 'flex', flexDirection: 'column', paddingY: 8 }}>
        <Controller
          name='blackhole'
          control={form.control}
          rules={{ required: true }}
          disabled={docker}
          render={({ field: { ref, ...field } }) => (
            <Label label={t('settings.blackhole.directory')}>
              <input type='text' {...field} sx={{ variant: 'input.default', fontFamily: 'monospace', width: '100%' }} required={true} />
            </Label>
          )}
        />
        {docker && (
          <small sx={{ display: 'block', marginTop: 6 }}><Trans t={t} i18nKey='settings.blackhole.docker' components={[<strong />, <code />, <code />]} /></small>
        )}
      </div>
      <div sx={{ paddingBottom: 8 }}>
        <Controller
          name='magnet'
          control={form.control}
          render={({ field: { value: checked, onChange } }) => (
            <Option type='checkbox' id='magnet' checked={checked} onChange={(e: any) => onChange(e.target.checked)}>
              <div sx={{ lineHeight: 'normal', paddingY: 10 }}>
                <strong>{emojize('🧲', t('settings.blackhole.magnet.label'))}</strong>
                <br />
                <small><Trans t={t} i18nKey='settings.blackhole.magnet.help' components={[<code />]} /></small>
              </div>
            </Option>
          )}
        />
      </div>
      {compact ? (
        <details sx={{ marginTop: 6, '>summary': { cursor: 'pointer', fontWeight: 'semibold', paddingY: 8 } }}>
          <summary>{t('settings.blackhole.shows.title')}</summary>
          {shows}
        </details>
      ) : (
        <>
          <h3>{t('settings.blackhole.shows.title')}</h3>
          {shows}
        </>
      )}
    </>
  )
}

const Blackhole = ({ ...props }) => {
  const { t } = useTranslation()
  useTitle(t('settings.documentTitle', { page: t('settings.sections.blackhole') }))
  const { onSave } = useOutletContext() as any
  const { config } = useConfigContext()
  const form = useForm({ defaultValues: config.getProperties() })

  return (
    <Body>
      <section>
        <article>
          <h2>{t('settings.sections.blackhole')}</h2>
          <p>
            <BlackholeIntro />
          </p>
          <form onSubmit={form.handleSubmit(onSave)}>
            <BlackholeFields form={form} />
            <div sx={{ display: 'flex', marginTop: 4 }}>
              <Button type='submit' color='primary' sx={{ flex: 1 }}>{t('settings.save.label')}</Button>
            </div>
          </form>
        </article>
      </section>
    </Body>
  )
}

export default Blackhole
