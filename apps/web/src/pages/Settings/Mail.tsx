import { useState } from 'react'
import { Option, Label, Button } from '@sensorr/ui'
import { useOutletContext } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import { Controller, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { emojize, useTitle } from '@sensorr/utils'
import { useConfigContext } from '../../contexts/Config/Config'
import { useAPI, errorOf } from '../../store/api'
import Body from '../../layout/Body/Body'

const SENT = [
  { key: 'welcome', emoji: '👋' },
  { key: 'reconnect', emoji: '🔌' },
  { key: 'requests', emoji: '🍿' },
  { key: 'wrapped', emoji: '🎞️' },
]

export const MailIntro = () => {
  const { t } = useTranslation()
  return <>{t('settings.mail.intro')}</>
}

export const MailFields = ({ form, compact = false }) => {
  const { t } = useTranslation()
  const secure = (
    <div sx={Mail.styles.field}>
      <Controller
        name='mail.secure'
        control={form.control}
        render={({ field: { value, onChange } }) => (
          <Option type='checkbox' id='mail.secure' checked={!!value} onChange={(e: any) => onChange(e.target.checked)}>
            <div sx={{ lineHeight: 'normal', paddingY: 10 }}>
              <strong>{emojize('🔒', t('settings.mail.secure.label'))}</strong>
              <br />
              <small><Trans t={t} i18nKey='settings.mail.secure.help' components={[<code />, <code />]} /></small>
            </div>
          </Option>
        )}
      />
    </div>
  )

  const sent = (
    <>
      <h3>{t('settings.mail.sent.title')}</h3>
      <p><Trans t={t} i18nKey='settings.mail.sent.help' components={[<code />]} /></p>
      {SENT.map(({ key, emoji }) => (
        <div key={key} sx={{ paddingY: 10 }}>
          <Controller
            name={`mail.send.${key}`}
            control={form.control}
            render={({ field: { value, onChange } }) => (
              <Option type='checkbox' id={`mail.send.${key}`} checked={!!value} onChange={(e: any) => onChange(e.target.checked)}>
                <div sx={{ lineHeight: 'normal', paddingY: 10 }}>
                  <strong>{emojize(emoji, t(`settings.mail.sent.${key}.label`))}</strong>
                  <br />
                  <small>{t(`settings.mail.sent.${key}.description`)}</small>
                </div>
              </Option>
            )}
          />
        </div>
      ))}
    </>
  )

  return (
    <>
      <div sx={Mail.styles.field}>
        <Controller
          name='mail.url'
          control={form.control}
          rules={{ required: true }}
          render={({ field: { ref, ...field } }) => (
            <Label label={t('settings.mail.url.label')}>
              <input type='url' {...field} placeholder={t('settings.mail.url.placeholder')} sx={{ variant: 'input.default', fontFamily: 'monospace', width: '100%' }} required={true} />
            </Label>
          )}
        />
        <small sx={{ marginTop: 6 }}><Trans t={t} i18nKey='settings.mail.url.help' values={{ origin: document.location.origin }} components={[<code />]} /></small>
      </div>
      <div sx={Mail.styles.row}>
        <div sx={{ ...Mail.styles.field, flex: 3 }}>
          <Controller
            name='mail.host'
            control={form.control}
            rules={{ required: true }}
            render={({ field: { ref, ...field } }) => (
              <Label label={t('settings.mail.host.label')}>
                <input type='text' {...field} placeholder={t('settings.mail.host.placeholder')} sx={{ variant: 'input.default', fontFamily: 'monospace', width: '100%' }} required={true} />
              </Label>
            )}
          />
        </div>
        <div sx={{ ...Mail.styles.field, flex: 1 }}>
          <Controller
            name='mail.port'
            control={form.control}
            rules={{ required: true }}
            render={({ field: { ref, onChange, ...field } }) => (
              <Label label={t('settings.mail.port.label')}>
                <input type='number' min={1} max={65535} {...field} onChange={(e) => onChange(Number(e.target.value))} sx={{ variant: 'input.default', fontFamily: 'monospace', width: '100%' }} required={true} />
              </Label>
            )}
          />
        </div>
      </div>
      {!compact && secure}
      <div sx={Mail.styles.row}>
        <div sx={{ ...Mail.styles.field, flex: 1 }}>
          <Controller
            name='mail.user'
            control={form.control}
            render={({ field: { ref, ...field } }) => (
              <Label label={t('settings.mail.user.label')}>
                <input type='text' autoComplete='off' {...field} sx={{ variant: 'input.default', fontFamily: 'monospace', width: '100%' }} />
              </Label>
            )}
          />
        </div>
        <div sx={{ ...Mail.styles.field, flex: 1 }}>
          <Controller
            name='mail.password'
            control={form.control}
            render={({ field: { ref, ...field } }) => (
              <Label label={t('settings.mail.password.label')}>
                <input type='password' autoComplete='new-password' {...field} sx={{ variant: 'input.default', fontFamily: 'monospace', width: '100%' }} />
              </Label>
            )}
          />
        </div>
      </div>
      <div sx={Mail.styles.field}>
        <Controller
          name='mail.from'
          control={form.control}
          rules={{ required: true }}
          render={({ field: { ref, ...field } }) => (
            <Label label={t('settings.mail.from.label')}>
              <input type='text' {...field} placeholder={t('settings.mail.from.placeholder')} sx={{ variant: 'input.default', fontFamily: 'monospace', width: '100%' }} required={true} />
            </Label>
          )}
        />
        <small sx={{ marginTop: 6 }}>{t('settings.mail.from.help')}</small>
      </div>
      {compact ? (
        <details sx={Mail.styles.more}>
          <summary>{t('settings.mail.more')}</summary>
          {secure}
          {sent}
        </details>
      ) : sent}
    </>
  )
}

const Mail = ({ ...props }) => {
  const { t } = useTranslation()
  useTitle(t('settings.documentTitle', { page: t('settings.sections.mail') }))
  const { onSave } = useOutletContext() as any
  const { config } = useConfigContext()
  const api = useAPI()
  const form = useForm({ defaultValues: config.getProperties() })
  const [to, setTo] = useState('')
  const [sending, setSending] = useState(false)

  const sendTest = async (e) => {
    e.preventDefault()
    setSending(true)

    try {
      const { uri, params, init } = api.query.mail.postTest({ body: { to } })
      await api.fetch(uri, params, init, { rawError: true })
      toast.success(t('settings.mail.test.sent', { to }))
    } catch (err) {
      toast.error((await errorOf(err)) || t('settings.mail.test.error', { to }))
    } finally {
      setSending(false)
    }
  }

  return (
    <Body>
      <section>
        <article>
          <h2>{t('settings.sections.mail')}</h2>
          <p><MailIntro /></p>
          <form onSubmit={form.handleSubmit(onSave)}>
            <MailFields form={form} />
            <div sx={{ display: 'flex', marginTop: 4 }}>
              <Button type='submit' color='primary' sx={{ flex: 1 }}>{t('settings.save.label')}</Button>
            </div>
          </form>
          <h3>{t('settings.mail.test.title')}</h3>
          <p>{t('settings.mail.test.help')}</p>
          <form onSubmit={sendTest} sx={Mail.styles.row}>
            <input type='email' id='mail-test-to' aria-label={t('settings.mail.test.to')} placeholder={t('settings.mail.test.placeholder')} value={to} onChange={(e) => setTo(e.target.value)} required={true} sx={{ variant: 'input.default', fontFamily: 'monospace', flex: 1, minWidth: 0 }} />
            <Button type='submit' color='primary' disabled={sending} aria-busy={sending}>{t('settings.mail.test.send')}</Button>
          </form>
        </article>
      </section>
    </Body>
  )
}

Mail.styles = {
  more: {
    marginTop: 6,
    '>summary': {
      cursor: 'pointer',
      fontWeight: 'semibold',
      paddingY: 8,
    },
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    paddingY: 8,
  },
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: 6,
  },
}

export default Mail
