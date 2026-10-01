import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Button, Icon, Link, Option } from '@sensorr/ui'
import { useGuestsContext } from '../../contexts/Guests/Guests'
import { useAPI } from '../../store/api'
import Body from '../../layout/Body/Body'
import { emojize, useTitle } from '@sensorr/utils'
import { useConfigContext } from '../../contexts/Config/Config'
import { ChoiceSelect, LookSelect, useFallback, WrappedLooks } from './Wrapped'
import { errorOf } from './Mail'

const linkOf = (token) => `${document.location.origin}/wrapped/${token}`
const dayOf = (timestamp) => new Date(timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

const Friends = ({ ...props }) => {
  useTitle('Settings - Friends')
  const api = useAPI()
  const { loading, guests, deleteGuest } = useGuestsContext() as any
  const [wrapped, setWrapped] = useState(null)
  const [wrappedError, setWrappedError] = useState(false)
  const [busy, setBusy] = useState({})
  const { onSave } = useOutletContext() as any
  const { config, load } = useConfigContext()
  const looks = useForm({ defaultValues: config.getProperties() })
  const { fallback, looks: offered } = useFallback(looks)

  const fetchWrapped = useCallback(() => {
    setWrappedError(false)
    const { uri, params, init } = api.query.wrapped.getGuests()
    api.fetch(uri, params, init)
      .then((results) => setWrapped(results.reduce((acc, guest) => ({ ...acc, [guest.email]: guest }), {})))
      .catch((err) => {
        console.warn(err)
        setWrappedError(true)
      })
  }, [])

  useEffect(fetchWrapped, [guests])

  const renewToken = useCallback(async (email) => {
    const { uri, params, init } = api.query.wrapped.postToken({ body: { email } })
    const { wrapped_token } = await api.fetch(uri, params, init)
    setWrapped((wrapped) => ({ ...wrapped, [email]: { ...wrapped[email], wrapped_token } }))
    return wrapped_token
  }, [])

  const copyLink = useCallback(async (email, renew = false) => {
    let token
    setBusy((busy) => ({ ...busy, [email]: true }))

    try {
      token = (!renew && wrapped?.[email]?.wrapped_token) || await renewToken(email)
    } catch (err) {
      console.warn(err)
      toast.error(`Error while creating the wrapped link of "${email}", try again`)
      return
    } finally {
      setBusy((busy) => ({ ...busy, [email]: false }))
    }

    try {
      await navigator.clipboard.writeText(linkOf(token))
      toast.success(renew ? `New wrapped link of "${email}" copied, the previous one no longer opens` : `Wrapped link of "${email}" copied to Clipboard`)
    } catch (err) {
      console.warn(err)
      toast.error(`Unable to copy to Clipboard, the wrapped link of "${email}" is ${linkOf(token)}`)
    }
  }, [wrapped])
  // Saved as soon as it is picked, like the link beside it
  const setLook = useCallback(async (email, look) => {
    const previous = wrapped[email]
    const next = { wrapped_theme: previous.wrapped_theme ?? null, wrapped_choice: previous.wrapped_choice ?? null, ...look }
    setWrapped((wrapped) => ({ ...wrapped, [email]: { ...wrapped[email], ...next } }))

    try {
      const { uri, params, init } = api.query.wrapped.postLook({ body: { email, theme: next.wrapped_theme, choice: next.wrapped_choice } })
      await api.fetch(uri, params, init)
    } catch (err) {
      console.warn(err)
      setWrapped((wrapped) => ({ ...wrapped, [email]: { ...wrapped[email], wrapped_theme: previous.wrapped_theme, wrapped_choice: previous.wrapped_choice } }))
      toast.error(`Error while saving the look of "${email}", try again`)
    }
  }, [wrapped])

  const mailable = !!(config.get('mail.host') && config.get('mail.from') && config.get('mail.url'))
  const [mailed, setMailed] = useState({})
  const [invitee, setInvitee] = useState('')
  const [invited, setInvited] = useState([])
  const [inviting, setInviting] = useState(false)

  // Sent from here, a mail goes whatever the Mail settings and the friend's unsubscribe link say
  const mail = useCallback(async (email, kind) => {
    const query = { reconnect: api.query.guests.postReconnect, wrapped: api.query.wrapped.postMail }[kind]
    setBusy((busy) => ({ ...busy, [email]: true }))

    try {
      const { uri, params, init } = query({ body: { email } })
      const sent = await api.fetch(uri, params, init, { rawError: true })
      setMailed((mailed) => ({ ...mailed, [email]: { ...mailed[email], ...sent } }))
      sent.wrapped_token && setWrapped((wrapped) => ({ ...wrapped, [email]: { ...wrapped[email], wrapped_token: sent.wrapped_token } }))
      toast.success(kind === 'wrapped' ? `Wrapped link mailed to "${email}"` : `Reconnect mail sent to "${email}"`)
    } catch (err) {
      toast.error((await errorOf(err)) || `Error while mailing "${email}", try again`)
    } finally {
      setBusy((busy) => ({ ...busy, [email]: false }))
    }
  }, [])

  const [open, setOpen] = useState(!!config.get('guests.public'))

  const setPublic = async (value) => {
    setOpen(value)

    try {
      const put = api.query.config.putConfig({ body: { key: 'guests.public', value } })
      await api.fetch(put.uri, put.params, put.init)
      const get = api.query.config.getConfig({})
      await load(await api.fetch(get.uri, get.params, get.init))
    } catch (err) {
      console.warn(err)
      setOpen(!value)
      toast.error('Error while saving who can link their Plex account, try again')
    }
  }

  const invite = async (e) => {
    e.preventDefault()
    setInviting(true)

    try {
      const { uri, params, init } = api.query.mail.postInvitation({ body: { to: invitee } })
      await api.fetch(uri, params, init, { rawError: true })
      toast.success(`Invitation sent to "${invitee}"`)
      setInvited((invited) => [...invited, invitee])
      setInvitee('')
    } catch (err) {
      toast.error((await errorOf(err)) || `Error while inviting "${invitee}", try again`)
    } finally {
      setInviting(false)
    }
  }

  return (
    <Body>
      <section>
        <article>
          <h2>Friends</h2>
          <p>
            Fullfill your friends movie <Link to='/movie/requests'>requests</Link> on Sensorr by following their <a href="https://support.plex.tv/articles/universal-watchlist/" target='_blank' rel='noreferer noopener'>Plex "Watchlist"</a>.
            Invite them as Sensorr guest, they will be asked to "link" their Plex account to the Sensorr server in order to keep a token for each of them to follow their Plex "Watchlist" regulary through <code>keep-in-touch</code> jobs.
            <small>
              <br/>
              Note: You don't need to own a Plex Media Server to use this feature, just invite your friends who use Plex.
            </small>
          </p>
          <h3>Guests</h3>
          {loading && (
            <div>
              <Icon value='spinner' />
            </div>
          )}
          {!loading && !Object.values(guests).length && (
            <p sx={{ textAlign: 'center' }}>
              No Guests invited yet
            </p>
          )}
          <div sx={Friends.styles.guests}>
            {Object.values(guests).map((guest: any) => (
              <div key={guest.email}>
                <img src={guest.avatar} alt='' />
                <div>
                  <strong>{guest.name}</strong>
                  <br/>
                  <small>{guest.email}</small>
                </div>
                <Button
                  type='button'
                  color='error'
                  variant='contain'
                  sx={{ flex: 1 }}
                  onClick={() => {
                    if(confirm(`Are you sure you want to delete guest "${guest.email}" ?`)) {
                      deleteGuest(guest.email)
                    }
                  }}
                >
                  Delete
                </Button>
                <footer sx={Friends.styles.wrapped}>
                  <h5 title={guest.plex_token_valid === false ? 'Plex account disconnected' : 'Plex account linked'}>
                    <span aria-label='Plex' sx={{ display: 'flex', justifyContent: 'center', width: '1em', fontSize: 3, color: guest.plex_token_valid === false ? 'grayDarkest' : 'plex' }}>❯</span>
                  </h5>
                  <p aria-live='polite' data-muted={guest.plex_token_valid !== false || undefined} data-prose={true}>
                    <Reconnect guest={guest} sent={mailed[guest.email]} />
                  </p>
                  <button
                    type='button'
                    sx={Friends.styles.action}
                    aria-label={`Mail ${guest.name} to reconnect their Plex account`}
                    title={!mailable ? 'Set up Mail first' : guest.plex_token_valid !== false ? 'Their Plex account is linked' : guest.mail_unsubscribed?.includes('reconnect') ? 'They stopped the reminders, mail them anyway' : 'Mail them to reconnect'}
                    disabled={!mailable || guest.plex_token_valid !== false || busy[guest.email]}
                    onClick={() => {
                      if (confirm(guest.mail_unsubscribed?.includes('reconnect')
                        ? `${guest.name} stopped the reconnect reminders. Mail them anyway ?`
                        : `Mail ${guest.name} to reconnect their Plex account ?`)) {
                        mail(guest.email, 'reconnect')
                      }
                    }}
                  >
                    ✉️
                  </button>
                </footer>
                <footer sx={Friends.styles.wrapped}>
                  <h5 title='wrapped'>🎞️<span>&nbsp;wrapped</span></h5>
                  <p aria-live='polite' data-muted={!(wrapped?.[guest.email]?.viewer && wrapped[guest.email].wrapped_token) || undefined}>
                    {wrappedError ? (
                      <span>Unable to load the wrapped links, <button type='button' sx={Friends.styles.retry} onClick={fetchWrapped}>retry</button></span>
                    ) : !wrapped ? (
                      <span aria-busy={true}>Looking for them in Tautulli...</span>
                    ) : !wrapped[guest.email]?.viewer ? (
                      <span>No Tautulli user with this email</span>
                    ) : wrapped[guest.email].wrapped_token ? (
                      <span><span sx={{ display: ['none', 'inline'] }}>{document.location.origin}</span>/wrapped/{wrapped[guest.email].wrapped_token}</span>
                    ) : (
                      <span>No link yet, 📋 creates one</span>
                    )}
                    {wrapped?.[guest.email]?.wrapped_token && (mailed[guest.email]?.wrapped_mailed_at || guest.wrapped_mailed_at) && (
                      <i role='img' sx={Friends.styles.mailed} aria-label={`Mailed ${dayOf(mailed[guest.email]?.wrapped_mailed_at || guest.wrapped_mailed_at)}`} title={`Mailed ${dayOf(mailed[guest.email]?.wrapped_mailed_at || guest.wrapped_mailed_at)}`} />
                    )}
                  </p>
                  <button
                    type='button'
                    sx={Friends.styles.action}
                    aria-label={`Copy the wrapped link of ${guest.name}`}
                    title='Copy link'
                    disabled={!wrapped?.[guest.email]?.viewer || busy[guest.email]}
                    onClick={() => copyLink(guest.email)}
                  >
                    📋
                  </button>
                  <button
                    type='button'
                    sx={Friends.styles.action}
                    aria-label={`Replace the wrapped link of ${guest.name}`}
                    title='New link, the previous one no longer opens'
                    disabled={!wrapped?.[guest.email]?.viewer || !wrapped[guest.email].wrapped_token || busy[guest.email]}
                    onClick={() => {
                      if (confirm(`Create a new wrapped link for "${guest.email}" ? The previous one will no longer open.`)) {
                        copyLink(guest.email, true)
                      }
                    }}
                  >
                    🔄
                  </button>
                  <button
                    type='button'
                    sx={Friends.styles.action}
                    aria-label={`Mail the wrapped link to ${guest.name}`}
                    title={!mailable ? 'Set up Mail first' : (mailed[guest.email]?.wrapped_mailed_at || guest.wrapped_mailed_at) ? `Mail the link, last mailed ${dayOf(mailed[guest.email]?.wrapped_mailed_at || guest.wrapped_mailed_at)}` : 'Mail the link'}
                    disabled={!mailable || !wrapped?.[guest.email]?.viewer || busy[guest.email]}
                    onClick={() => {
                      if (confirm(`Mail the wrapped link to ${guest.name} ?`)) {
                        mail(guest.email, 'wrapped')
                      }
                    }}
                  >
                    ✉️
                  </button>
                  {wrapped?.[guest.email]?.viewer && (
                    <div sx={Friends.styles.look}>
                      <LookSelect label={`Look of the wrapped of ${guest.name}`} value={wrapped[guest.email].wrapped_theme ?? null} fallback={fallback.theme} looks={offered} onChange={(wrapped_theme) => setLook(guest.email, { wrapped_theme })} />
                      <ChoiceSelect label={`Whether ${guest.name} can switch the look`} value={wrapped[guest.email].wrapped_choice ?? null} fallback={fallback.choice} onChange={(wrapped_choice) => setLook(guest.email, { wrapped_choice })} />
                    </div>
                  )}
                </footer>
              </div>
            ))}
          </div>
          {!mailable && (
            <p><small>Set up <Link to='/settings/mail'>Mail</Link> to mail your friends from here.</small></p>
          )}
          <h3>Invitation</h3>
          <p sx={{ lineHeight: 'body' }}>
            Your friend gets a mail asking them to link their Plex account from <a href={`${document.location.origin}/keep-in-touch`} target='_blank' rel='noreferer noopener'>{document.location.origin}/keep-in-touch</a>. Nothing is kept until they do.
          </p>
          <form onSubmit={invite} sx={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            <input type='email' id='invitation-to' aria-label='Address of the friend to invite' placeholder='friend@example.com' value={invitee} onChange={(e) => setInvitee(e.target.value)} required={true} sx={{ variant: 'input.default', fontFamily: 'monospace', flex: 1, minWidth: 0 }} />
            <Button type='submit' color='primary' disabled={!mailable || inviting} aria-busy={inviting} title={mailable ? undefined : 'Set up Mail first'}>Invite</Button>
          </form>
          <div sx={{ marginTop: 6 }}>
            <Option type='checkbox' id='guests.public' checked={open} disabled={!config.get('plex.token')} onChange={(e: any) => setPublic(e.target.checked)}>
              <div sx={{ lineHeight: 'normal', paddingY: 10 }}>
                <strong>{emojize('🌍', 'Anyone with a Plex account')}</strong>
                <br />
                <small>{config.get('plex.token') ? 'Off, only you and the people your Plex server is shared with can link their account, besides the friends already linked' : 'Without a Plex server set up in Sensorr, anyone can link their account'}</small>
              </div>
            </Option>
          </div>
          {!!invited.length && (
            <p aria-live='polite'><small>Invited {invited.join(', ')}, they show up in Guests once they link their Plex account.</small></p>
          )}
        </article>
        <article>
          <h2>Wrapped</h2>
          <p>Each friend matched to a Tautulli user gets a yearly page of what they watched on Plex, the wrapped. Pick the look it wears, give a year its own, then a friend in their card above.</p>
          <WrappedLooks form={looks} onSave={onSave} />
        </article>
      </section>
    </Body>
  )
}

// The reconnect mails since the token died, the first one and its 3 reminders, as dots: filled once sent
const Reconnect = ({ guest, sent = {} }: { guest: any, sent?: any }) => {
  const checked = guest.plex_token_checked_at ? `Checked ${dayOf(guest.plex_token_checked_at)}` : undefined

  if (guest.plex_token_valid !== false) {
    return <span title={checked}>Linked</span>
  }

  const at = sent.reconnect_mailed_at || guest.reconnect_mailed_at
  const count = Math.min(Math.max(sent.reconnect_mails ?? guest.reconnect_mails ?? 0, at ? 1 : 0), 4)
  const stopped = guest.mail_unsubscribed?.includes('reconnect')

  return (
    <span sx={Friends.styles.reconnect}>
      <span title={checked}>Disconnected</span>
      <span role='img' aria-label={`${count} of 4 reconnect mails sent${at ? `, last on ${dayOf(at)}` : ''}`} title={`${count} of 4 mails sent${at ? `, last on ${dayOf(at)}` : ''}`}>
        {[0, 1, 2, 3].map((index) => <i key={index} data-sent={index < count || undefined} />)}
      </span>
      {stopped && <span role='img' aria-label='Stopped the reminders' title='Stopped the reminders'>🔕</span>}
    </span>
  )
}

Friends.styles = {
  guests: {
    marginBottom: 2,
    '>div': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginY: 6,
      border: '1px solid',
      borderColor: 'grayDark',
      borderRadius: '0.25rem',
      paddingX: 6,
      paddingY: 8,
      '>img': {
        height: '48px',
        width: '48px',
        borderRadius: '50%',
      },
      '>div': {
        flex: 1,
        minWidth: 0,
        marginX: 4,
      },
      '>button': {
        flex: 0,
      },
      flexWrap: 'wrap',
    }
  },
  wrapped: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'stretch',
    flex: '1 1 100%',
    marginTop: 8,
    marginX: -6,
    marginBottom: -8,
    borderTop: '1px solid',
    borderColor: 'grayDark',
    borderBottomLeftRadius: '0.25rem',
    borderBottomRightRadius: '0.25rem',
    overflow: 'hidden',
    '>h5': {
      display: 'flex',
      alignItems: 'center',
      margin: 12,
      paddingY: 12,
      paddingX: 6,
      backgroundColor: 'grayLight',
      borderRight: '1px solid',
      borderColor: 'grayDark',
      fontFamily: 'monospace',
      whiteSpace: 'nowrap',
      '>span': {
        display: ['none', 'inline'],
      },
    },
    '>p': {
      display: 'flex',
      alignItems: 'center',
      flex: 1,
      minWidth: 0,
      marginY: 12,
      marginX: 6,
      fontFamily: 'monospace',
      fontSize: 5,
      '>span': {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
      '&[data-prose]': {
        fontFamily: 'body',
        '>span': {
          whiteSpace: ['normal', 'nowrap'],
        },
      },
      '&[data-muted]': {
        fontFamily: 'body',
        color: 'grayDarkest',
        '>span': {
          whiteSpace: ['normal', 'nowrap'],
        },
      },
    },
  },
  // The friend's own look, a second line of the wrapped footer
  look: {
    display: 'grid',
    gridTemplateColumns: ['1fr', '1fr 1fr'],
    gap: 4,
    flex: '1 1 100%',
    padding: 6,
    borderTop: '1px solid',
    borderColor: 'grayDark',
    '>select[data-custom]': {
      borderColor: 'primary',
    },
  },
  action: {
    variant: 'button.reset',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    minWidth: '2.5rem',
    minHeight: '2.5rem',
    paddingY: 8,
    paddingX: 6,
    fontSize: 5,
    borderLeft: '1px solid',
    borderColor: 'grayDark',
    lineHeight: 1.5,
    ':hover:not(:disabled)': {
      backgroundColor: 'gray',
    },
    ':disabled': {
      opacity: 0.5,
      filter: 'grayscale(1)',
    },
  },
  reconnect: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    '>span[role=img]': {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      cursor: 'default',
    },
    '>span[role=img]>i': {
      width: '0.5em',
      height: '0.5em',
      borderRadius: '50%',
      border: '1px solid',
      borderColor: 'grayDarker',
    },
    '>span[role=img]>i[data-sent]': {
      borderColor: 'grayDarkest',
      backgroundColor: 'grayDarkest',
    },
  },
  mailed: {
    flexShrink: 0,
    marginLeft: 6,
    width: '0.5em',
    height: '0.5em',
    borderRadius: '50%',
    backgroundColor: 'grayDarkest',
    cursor: 'default',
  },
  retry: {
    background: 'none',
    border: 'none',
    padding: 0,
    font: 'inherit',
    color: 'primary',
    textDecoration: 'underline',
    cursor: 'pointer',
  },
}

export default Friends
