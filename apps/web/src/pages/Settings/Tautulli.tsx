import React from 'react'
import { Label, Button } from '@sensorr/ui'
import { useOutletContext } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import { Controller, useForm } from 'react-hook-form'
import { useConfigContext } from '../../contexts/Config/Config'
import Body from '../../layout/Body/Body'
import { useTitle } from '@sensorr/utils'

const Tautulli = ({ ...props }) => {
  const { t } = useTranslation()
  useTitle(t('settings.documentTitle', { page: t('settings.sections.tautulli') }))
  const { onSave } = useOutletContext() as any
  const { config } = useConfigContext()
  const form = useForm({ defaultValues: config.getProperties() })

  return (
    <Body>
      <section>
        <article>
          <h2>{t('settings.sections.tautulli')}</h2>
          <p><Trans t={t} i18nKey='settings.tautulli.intro' components={[<a href='https://tautulli.com/' target='_blank' rel='noopener noreferrer' />, <code />, <code />]} /></p>
          <form onSubmit={form.handleSubmit(onSave)}>
            <div sx={{ display: 'flex', flexDirection: 'column', paddingY: 8 }}>
              <Controller
                name='tautulli.url'
                control={form.control}
                rules={{ required: true }}
                render={({ field: { ref, ...field } }) => (
                  <Label label={t('settings.tautulli.url.label')}>
                    <input type='url' {...field} placeholder={t('settings.tautulli.url.placeholder')} sx={{ variant: 'input.default', fontFamily: 'monospace', width: '100%' }} required={true} />
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
                  <Label label={t('settings.tautulli.key.label')}>
                    <input type='text' {...field} sx={{ variant: 'input.default', fontFamily: 'monospace', width: '100%' }} required={true} />
                  </Label>
                )}
              />
              <small sx={{ marginTop: 6 }}><Trans t={t} i18nKey='settings.tautulli.key.help' components={[<code />, <code />, <code />]} /></small>
            </div>
            <div sx={{ display: 'flex', marginTop: 4 }}>
              <Button type='submit' color='primary' sx={{ flex: 1 }}>{t('settings.save.label')}</Button>
            </div>
          </form>
        </article>
      </section>
    </Body>
  )
}

export default Tautulli
