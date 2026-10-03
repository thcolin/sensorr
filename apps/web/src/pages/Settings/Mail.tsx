import { useState } from 'react'
import { Option, Label, Button } from '@sensorr/ui'
import { useOutletContext } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { emojize, useTitle } from '@sensorr/utils'
import { useConfigContext } from '../../contexts/Config/Config'
import { useAPI } from '../../store/api'
import Body from '../../layout/Body/Body'

const SENT = [
  { key: 'welcome', emoji: '👋', label: 'Welcome', description: 'Once a friend links their Plex account' },
  { key: 'reconnect', emoji: '🔌', label: 'Reconnect', description: 'When Plex disconnects a friend, then up to 3 weekly reminders, and once they reconnect' },
  { key: 'requests', emoji: '🍿', label: 'Ready to watch', description: 'The requests of a friend that reached Plex, on each run of the 📬 Mail job' },
  { key: 'wrapped', emoji: '🎞️', label: 'Wrapped', description: 'When an edition of the wrapped freezes' },
]

// The API answers a refused mail with the SMTP server's own words, they are the ones that say what to fix
export const errorOf = async (err) => {
  try {
    return (await err.json()).message
  } catch (e) {
    return null
  }
}

export const MailIntro = () => (
  <>Sensorr mails your friends: their invitation, a welcome once their Plex account is linked, a reminder when Plex disconnects it, their requests ready to watch and their wrapped. Any SMTP server works, the one of your mail provider included.</>
)

export const MailFields = ({ form, compact = false }) => {
  const secure = (
    <div sx={Mail.styles.field}>
      <Controller
        name='mail.secure'
        control={form.control}
        render={({ field: { value, onChange } }) => (
          <Option type='checkbox' id='mail.secure' checked={!!value} onChange={(e: any) => onChange(e.target.checked)}>
            <div sx={{ lineHeight: 'normal', paddingY: 10 }}>
              <strong>{emojize('🔒', 'TLS from the start')}</strong>
              <br />
              <small>Usually on port <code>465</code>. Off, the connection still upgrades to TLS when the server offers it, usually on port <code>587</code></small>
            </div>
          </Option>
        )}
      />
    </div>
  )

  const sent = (
    <>
      <h3>Sent on their own</h3>
      <p>An invitation, a test, or a mail sent from <code>Friends</code> always goes.</p>
      {SENT.map(({ key, emoji, label, description }) => (
        <div key={key} sx={{ paddingY: 10 }}>
          <Controller
            name={`mail.send.${key}`}
            control={form.control}
            render={({ field: { value, onChange } }) => (
              <Option type='checkbox' id={`mail.send.${key}`} checked={!!value} onChange={(e: any) => onChange(e.target.checked)}>
                <div sx={{ lineHeight: 'normal', paddingY: 10 }}>
                  <strong>{emojize(emoji, label)}</strong>
                  <br />
                  <small>{description}</small>
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
            <Label label='Address of Sensorr'>
              <input type='url' {...field} placeholder='https://sensorr.example.com' sx={{ variant: 'input.default', fontFamily: 'monospace', width: '100%' }} required={true} />
            </Label>
          )}
        />
        <small sx={{ marginTop: 6 }}>The one your friends open from home, every link of a mail starts with it, like <code>{document.location.origin}</code> if they reach this page there</small>
      </div>
      <div sx={Mail.styles.row}>
        <div sx={{ ...Mail.styles.field, flex: 3 }}>
          <Controller
            name='mail.host'
            control={form.control}
            rules={{ required: true }}
            render={({ field: { ref, ...field } }) => (
              <Label label='SMTP host'>
                <input type='text' {...field} placeholder='smtp.example.com' sx={{ variant: 'input.default', fontFamily: 'monospace', width: '100%' }} required={true} />
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
              <Label label='Port'>
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
              <Label label='Username'>
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
              <Label label='Password'>
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
            <Label label='Sender'>
              <input type='text' {...field} placeholder='Thomas <sensorr@example.com>' sx={{ variant: 'input.default', fontFamily: 'monospace', width: '100%' }} required={true} />
            </Label>
          )}
        />
        <small sx={{ marginTop: 6 }}>Its name is the one your friends read in every mail, give yours</small>
      </div>
      {compact ? (
        <details sx={Mail.styles.more}>
          <summary>More</summary>
          {secure}
          {sent}
        </details>
      ) : sent}
    </>
  )
}

const Mail = ({ ...props }) => {
  useTitle('Settings - Mail')
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
      toast.success(`Test mail sent to "${to}"`)
    } catch (err) {
      toast.error((await errorOf(err)) || `Error while sending the test mail to "${to}", try again`)
    } finally {
      setSending(false)
    }
  }

  return (
    <Body>
      <section>
        <article>
          <h2>Mail</h2>
          <p><MailIntro /></p>
          <form onSubmit={form.handleSubmit(onSave)}>
            <MailFields form={form} />
            <div sx={{ display: 'flex', marginTop: 4 }}>
              <Button type='submit' color='primary' sx={{ flex: 1 }}>Save</Button>
            </div>
          </form>
          <h3>Test</h3>
          <p>Sends a mail with the saved settings, save them first.</p>
          <form onSubmit={sendTest} sx={Mail.styles.row}>
            <input type='email' id='mail-test-to' aria-label='Address to send the test mail to' placeholder='you@example.com' value={to} onChange={(e) => setTo(e.target.value)} required={true} sx={{ variant: 'input.default', fontFamily: 'monospace', flex: 1, minWidth: 0 }} />
            <Button type='submit' color='primary' disabled={sending} aria-busy={sending}>Send test</Button>
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
