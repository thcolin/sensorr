import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Bar, Button, Icon, Link, Option } from '@sensorr/ui'
import { useGuestsContext } from '../../contexts/Guests/Guests'
import { useAPI } from '../../store/api'
import Body from '../../layout/Body/Body'
import { emojize, useTitle } from '@sensorr/utils'
import { useConfigContext } from '../../contexts/Config/Config'
import { WrappedLooks } from './Wrapped'
import { errorOf } from './Mail'
import { Invitation } from './Invitation'
import { Face } from './Face'

const linkOf = (token) => `${document.location.origin}/wrapped/${token}`
const dayOf = (timestamp) => new Date(timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

export const FriendsIntro = () => (
  <>
    Fulfill your friends' movie <Link to='/movie/requests'>requests</Link> on Sensorr by following their <a href="https://support.plex.tv/articles/universal-watchlist/" target='_blank' rel='noreferrer noopener'>Plex "Watchlist"</a>.
    Invite them as Sensorr guest, they will be asked to "link" their Plex account to the Sensorr server in order to keep a token for each of them to follow their Plex "Watchlist" regularly through <code>keep-in-touch</code> jobs.
    <small>
      <br/>
      Note: You don't need to own a Plex Media Server to use this feature, just invite your friends who use Plex.
    </small>
  </>
)

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
      const { uri, params, init } = api.query.mail.postInvitation({ body: { to: [{ email: invitee }] } })
      const [result] = await api.fetch(uri, params, init, { rawError: true })

      if (result.error) {
        toast.error(result.error)
        return
      }

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
            <FriendsIntro />
          </p>
          <h3>Guests</h3>
          {loading && (
            // A guest's row: the avatar, the name over the email
            <div sx={Friends.styles.guests} aria-hidden={true}>
              {[[7, 13], [5.5, 11], [8, 15]].map(([name, email], index) => (
                <div key={index} sx={Friends.styles.guest}>
                  <Bar width='44px' height='44px' radius='50%' sx={{ gridArea: 'avatar' }} />
                  <div sx={{ ...Friends.styles.who, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Bar width={`${name}em`} height='0.875em' />
                    <Bar width={`${email}em`} height='0.625em' />
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && !Object.values(guests).length && (
            <p sx={{ textAlign: 'center' }}>
              No Guests invited yet
            </p>
          )}
          <div sx={Friends.styles.guests}>
            {Object.values(guests).map((guest: any) => {
              const stopped = guest.mail_unsubscribed?.includes('reconnect')
              const viewer = wrapped?.[guest.email]?.viewer
              const wrappedTitle = wrappedError ? 'Unable to load the wrapped links' : !wrapped ? 'Looking for them in Tautulli...' : !viewer ? 'No Tautulli user with this email, no wrapped' : 'Their wrapped'

              return (
                <div key={guest.email} sx={Friends.styles.guest}>
                  <Avatar guest={guest} sent={mailed[guest.email]} />
                  <div sx={Friends.styles.who}>
                    <strong>{guest.name}</strong>
                    <small>{guest.email}</small>
                  </div>
                  {guest.plex_token_valid === false && (
                    <button
                      type='button'
                      sx={Friends.styles.disconnected}
                      title={!mailable ? 'Their Plex account is disconnected, set up Mail to remind them' : stopped ? 'They stopped the reminders, mail them anyway' : 'Mail them to reconnect their Plex account'}
                      // Not `disabled`, which hides the reason in the title from the hover and from screen readers
                      aria-disabled={!mailable || busy[guest.email] || undefined}
                      onClick={() => {
                        if (mailable && !busy[guest.email] && window.confirm(stopped
                          ? `${guest.name} stopped the reconnect reminders. Mail them anyway ?`
                          : `Mail ${guest.name} to reconnect their Plex account ?`)) {
                          mail(guest.email, 'reconnect')
                        }
                      }}
                    >
                      <i />
                      Disconnected
                    </button>
                  )}
                  <label sx={Friends.styles.more}>
                    <Icon value='chevron' height='0.75em' width='0.75em' />
                    <select
                      aria-label={`Wrapped of ${guest.name}`}
                      title={wrappedTitle}
                      value=''
                      disabled={!viewer || busy[guest.email]}
                      onPointerDown={(e) => { e.currentTarget.dataset.key = '' }}
                      onKeyDown={(e) => { e.currentTarget.dataset.key = e.key }}
                      onChange={(e) => {
                        const action = e.target.value
                        const key = e.target.dataset.key
                        e.target.value = ''

                        // On Windows and Linux, an arrow or a letter on the closed select changes it: nothing was picked
                        if (key && key !== 'Enter' && key !== ' ') {
                          return
                        }

                        if (action === 'mail' && window.confirm(`Mail the wrapped link to ${guest.name} ?`)) {
                          mail(guest.email, 'wrapped')
                        } else if (action === 'copy') {
                          copyLink(guest.email)
                        } else if (action === 'renew' && window.confirm(`Create a new wrapped link for "${guest.email}" ? The previous one will no longer open.`)) {
                          copyLink(guest.email, true)
                        }
                      }}
                    >
                      <option value='' hidden={true}>Wrapped</option>
                      <optgroup label='Wrapped'>
                        <option value='mail' disabled={!mailable}>Send by mail</option>
                        <option value='copy'>Copy link</option>
                        <option value='renew' disabled={!wrapped?.[guest.email]?.wrapped_token}>New link</option>
                      </optgroup>
                    </select>
                  </label>
                  <button
                    type='button'
                    sx={Friends.styles.remove}
                    title={`Remove ${guest.name}`}
                    aria-label={`Remove ${guest.name}`}
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete guest "${guest.email}" ?`)) {
                        deleteGuest(guest.email)
                      }
                    }}
                  >
                    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' style={{ transform: 'rotate(45deg)' }} aria-hidden='true'>
                      <path fill='currentColor' d='M24 10h-10v-10h-4v10h-10v4h10v10h4v-10h10z' />
                    </svg>
                  </button>
                </div>
              )
            })}
          </div>
          {wrappedError && (
            <p><small>Unable to load the wrapped links, <button type='button' sx={Friends.styles.retry} onClick={fetchWrapped}>retry</button></small></p>
          )}
          {!mailable && (
            <p><small>Set up <Link to='/settings/mail'>Mail</Link> to mail your friends from here.</small></p>
          )}
          <Invitation mailable={mailable}>
            <div sx={{ marginTop: 4 }}>
              <Option type='checkbox' id='guests.public' checked={open} disabled={!config.get('plex.token')} onChange={(e: any) => setPublic(e.target.checked)}>
                <div sx={{ lineHeight: 'normal', paddingY: 10 }}>
                  <strong>{emojize('🌍', 'Open to anyone with a Plex account')}</strong>
                  <br />
                  <small>{config.get('plex.token') ? 'Let people outside your Plex server link their account from /keep-in-touch, and invite them by address.' : 'Without a Plex server set up in Sensorr, anyone can link their account'}</small>
                </div>
              </Option>
            </div>
            {(open || !config.get('plex.token')) && (
              <form onSubmit={invite} sx={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4, marginBottom: 6 }}>
                <input type='email' id='invitation-to' aria-label='Address of the friend to invite' placeholder='friend@example.com' value={invitee} onChange={(e) => setInvitee(e.target.value)} required={true} sx={{ variant: 'input.default', fontFamily: 'monospace', flex: 1, minWidth: 0 }} />
                <Button type='submit' color='primary' disabled={!mailable || inviting} aria-busy={inviting} title={mailable ? undefined : 'Set up Mail first'}>Invite</Button>
              </form>
            )}
            {!!invited.length && (
              <p aria-live='polite'><small>Invited {invited.join(', ')}, they show up in Guests once they link their Plex account.</small></p>
            )}
          </Invitation>
          <h3>Wrapped</h3>
          <p>A yearly page of what each friend watched on Plex.</p>
          <WrappedLooks form={looks} onSave={onSave} />
        </article>
      </section>
    </Body>
  )
}

// A linked friend wears a thin Plex ring and the Plex chevron, a disconnected one the reconnect mails sent since their
// token died, the first one and its 3 reminders, as four arcs filled in red once sent, and a grey chevron
const Avatar = ({ guest, sent = {} }: { guest: any, sent?: any }) => {
  const linked = guest.plex_token_valid !== false
  const at = sent.reconnect_mailed_at || guest.reconnect_mailed_at
  const count = linked ? 0 : Math.min(Math.max(sent.reconnect_mails ?? guest.reconnect_mails ?? 0, at ? 1 : 0), 4)
  const stopped = guest.mail_unsubscribed?.includes('reconnect')
  const checked = guest.plex_token_checked_at ? `, checked ${dayOf(guest.plex_token_checked_at)}` : ''
  const label = linked
    ? `Plex account linked${checked}`
    : `Plex account disconnected${checked}, ${count} of 4 reconnect mails sent${at ? `, last on ${dayOf(at)}` : ''}${stopped ? ', stopped the reminders' : ''}`
  const arcs = [1, 2, 3, 4].map((index) => `var(--theme-ui-colors-${index <= count ? 'error' : 'grayDark'})`)

  return (
    <span
      role='img'
      aria-label={label}
      title={label}
      sx={Friends.styles.avatar}
      data-linked={linked || undefined}
      style={linked ? {} : { '--arcs': `conic-gradient(from -45deg, ${arcs[0]} 0 22.5%, transparent 0 25%, ${arcs[1]} 0 47.5%, transparent 0 50%, ${arcs[2]} 0 72.5%, transparent 0 75%, ${arcs[3]} 0 97.5%, transparent 0)` } as any}
    >
      <Face person={guest} />
      <b aria-hidden={true}>
        <svg viewBox='0 0 512 512'>
          <path fill='currentColor' d='m256 70h-108l108 186-108 186h108l108-186z' />
        </svg>
      </b>
    </span>
  )
}

Friends.styles = {
  guests: {
    marginBottom: 2,
  },
  // One row per friend, the two squares of a row of Settings › Indexers at its end
  guest: {
    display: 'grid',
    gridTemplateColumns: ['auto minmax(0, 1fr) auto auto', 'auto minmax(0, 1fr) auto auto auto'],
    gridTemplateAreas: ['"avatar who more remove" "avatar disconnected more remove"', '"avatar who disconnected more remove"'],
    alignItems: 'center',
    columnGap: 6,
    rowGap: 10,
    paddingY: 8,
    paddingX: 10,
    borderBottom: '1px solid',
    borderColor: 'grayLight',
  },
  avatar: {
    gridArea: 'avatar',
    position: 'relative',
    display: 'grid',
    placeItems: 'center',
    width: '44px',
    height: '44px',
    cursor: 'default',
    '::before': {
      content: '""',
      position: 'absolute',
      inset: '0px',
      borderRadius: '50%',
      background: 'var(--arcs)',
      mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))',
    },
    '&[data-linked]::before': {
      background: 'var(--theme-ui-colors-plex)',
      mask: 'radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 1.5px))',
    },
    '&:not([data-linked]) >img, &:not([data-linked]) >span': {
      opacity: 0.7,
    },
    '>b': {
      position: 'absolute',
      right: '-4px',
      bottom: '-4px',
      display: 'grid',
      placeItems: 'center',
      width: '18px',
      height: '18px',
      borderRadius: '50%',
      backgroundColor: 'white',
      color: 'grayDarker',
      '>svg': {
        width: '14px',
        height: '14px',
      },
    },
    '&[data-linked] >b': {
      color: 'plex',
    },
  },
  who: {
    gridArea: 'who',
    minWidth: '0px',
    lineHeight: 'normal',
    '>strong, >small': {
      display: 'block',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    '>small': {
      color: 'grayDarkest',
    },
  },
  // A grey pill with a red dot, a click mails the friend to reconnect
  disconnected: {
    variant: 'button.reset',
    gridArea: 'disconnected',
    justifySelf: 'start',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 9,
    height: '2em',
    paddingY: 12,
    paddingLeft: 6,
    paddingRight: 5,
    borderRadius: '2em',
    backgroundColor: 'gray',
    color: 'grayDarkest',
    fontSize: 6,
    fontWeight: 'semibold',
    whiteSpace: 'nowrap',
    marginRight: ['0px', 10],
    '>i': {
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      backgroundColor: 'error',
    },
    ':hover:not([aria-disabled])': {
      backgroundColor: 'grayDark',
      color: 'text',
    },
    '&[aria-disabled]': {
      cursor: 'default',
    },
  },
  // The chevron with a native select over it, like `State` of @sensorr/ui
  more: {
    gridArea: 'more',
    position: 'relative',
    display: 'grid',
    placeItems: 'center',
    width: '2rem',
    height: '2rem',
    borderRadius: '0.25em',
    color: 'grayDarkest',
    ':hover:not(:has(select:disabled))': {
      backgroundColor: 'gray',
      color: 'text',
    },
    ':has(select:disabled)': {
      opacity: 0.4,
    },
    ':has(select:focus-visible)': {
      outline: '2px solid',
      outlineColor: 'primary',
      outlineOffset: 2,
    },
    '>select': {
      position: 'absolute',
      inset: '0px',
      width: '100%',
      height: '100%',
      opacity: 0,
      appearance: 'none',
      border: 'none',
      cursor: 'pointer',
      ':disabled': {
        cursor: 'default',
      },
    },
  },
  // The remove button of Settings › Indexers, at the size of the chevron
  remove: {
    variant: 'button.reset',
    gridArea: 'remove',
    display: 'grid',
    placeItems: 'center',
    width: '2rem',
    height: '2rem',
    padding: 12,
    borderRadius: '0.25em',
    backgroundColor: 'error',
    color: 'whitePure',
    '>svg': {
      width: '0.65em',
      height: '0.65em',
    },
    ':hover': {
      backgroundColor: 'errorDarker',
    },
    ':active': {
      backgroundColor: 'errorDarkest',
    },
  },
  retry: {
    background: 'none',
    border: 'none',
    padding: 12,
    font: 'inherit',
    color: 'primary',
    textDecoration: 'underline',
    cursor: 'pointer',
  },
}

export default Friends
