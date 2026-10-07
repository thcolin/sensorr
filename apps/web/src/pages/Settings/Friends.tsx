import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Trans, useTranslation } from 'react-i18next'
import i18n from '@sensorr/i18n'
import toast from 'react-hot-toast'
import { Bar, Button, Icon, Link, Option } from '@sensorr/ui'
import { useGuestsContext } from '../../contexts/Guests/Guests'
import { useAPI, errorOf } from '../../store/api'
import Body from '../../layout/Body/Body'
import { emojize, useTitle } from '@sensorr/utils'
import { useConfigContext } from '../../contexts/Config/Config'
import { WrappedLooks } from './Wrapped'
import { Invitation } from './Invitation'
import { Face } from './Face'

// Next to the app, under its <base href>: `/wrapped/`, or `/sensorr/wrapped/` in the demo
const linkOf = (token) => new URL(`wrapped/${token}`, document.baseURI).href
const dayOf = (timestamp) => new Date(timestamp).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' })

export const FriendsIntro = () => {
  const { t } = useTranslation()

  return (
    <>
      <Trans t={t} i18nKey='settings.friends.intro' components={[<Link to='/movie/requests' />, <a href="https://support.plex.tv/articles/universal-watchlist/" target='_blank' rel='noreferrer noopener' />, <code />]} />
      <small>
        <br/>
        {t('settings.friends.note')}
      </small>
    </>
  )
}

const Friends = ({ ...props }) => {
  const { t } = useTranslation()
  useTitle(t('settings.documentTitle', { page: t('settings.sections.friends') }))
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
      toast.error(t('settings.friends.wrapped.createError', { email }))
      return
    } finally {
      setBusy((busy) => ({ ...busy, [email]: false }))
    }

    try {
      await navigator.clipboard.writeText(linkOf(token))
      toast.success(renew ? t('settings.friends.wrapped.renewed', { email }) : t('settings.friends.wrapped.copied', { email }))
    } catch (err) {
      console.warn(err)
      toast.error(t('settings.friends.wrapped.copyError', { email, link: linkOf(token) }))
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
      toast.success(kind === 'wrapped' ? t('settings.friends.wrapped.mailed', { email }) : t('settings.friends.reconnect.sent', { email }))
    } catch (err) {
      toast.error((await errorOf(err)) || t('settings.friends.mailError', { email }))
    } finally {
      setBusy((busy) => ({ ...busy, [email]: false }))
    }
  }, [])

  const [open, setOpen] = useState(!!config.get('guests.public'))
  const server = !!config.get('plex.token')

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
      toast.error(t('settings.friends.public.error'))
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

      toast.success(t('settings.invitation.sent', { email: invitee }))
      setInvited((invited) => [...invited, invitee])
      setInvitee('')
    } catch (err) {
      toast.error((await errorOf(err)) || t('settings.friends.invite.error', { email: invitee }))
    } finally {
      setInviting(false)
    }
  }

  return (
    <Body>
      <section>
        <article>
          <h2>{t('settings.sections.friends')}</h2>
          <p>
            <FriendsIntro />
          </p>
          <h3>{t('settings.friends.guests.title')}</h3>
          {loading && (
            <div sx={Friends.styles.guests} aria-hidden={true}>
              {[[7, 13], [5.5, 11], [8, 15]].map(([name, email], index) => (
                <div key={index} sx={Friends.styles.guest}>
                  <Bar width='44px' height='44px' radius='50%' sx={{ gridArea: 'avatar' }} />
                  <div sx={{ ...Friends.styles.who, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Bar width={`${name}em`} height='1em' />
                    <Bar width={`${email}em`} height='0.833em' />
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && !Object.values(guests).length && (
            <p sx={{ textAlign: 'center' }}>
              {t('settings.friends.guests.empty')}
            </p>
          )}
          <div sx={Friends.styles.guests}>
            {Object.values(guests).map((guest: any) => {
              const stopped = guest.mail_unsubscribed?.includes('reconnect')
              const viewer = wrapped?.[guest.email]?.viewer
              const wrappedTitle = wrappedError ? t('settings.friends.wrapped.unavailable') : !wrapped ? t('settings.friends.wrapped.looking') : !viewer ? t('settings.friends.wrapped.noViewer') : t('settings.friends.wrapped.theirs')

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
                      title={!mailable ? t('settings.friends.reconnect.unmailable') : stopped ? t('settings.friends.reconnect.stopped') : t('settings.friends.reconnect.title')}
                      // Not `disabled`, which hides the reason in the title from the hover and from screen readers
                      aria-disabled={!mailable || busy[guest.email] || undefined}
                      onClick={() => {
                        if (mailable && !busy[guest.email] && window.confirm(stopped
                          ? t('settings.friends.reconnect.confirmStopped', { name: guest.name })
                          : t('settings.friends.reconnect.confirm', { name: guest.name }))) {
                          mail(guest.email, 'reconnect')
                        }
                      }}
                    >
                      <i />
                      {t('settings.friends.disconnected')}
                    </button>
                  )}
                  <label sx={Friends.styles.more}>
                    <Icon value='chevron' height='0.75em' width='0.75em' />
                    <select
                      aria-label={t('settings.friends.wrapped.label', { name: guest.name })}
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

                        if (action === 'mail' && window.confirm(t('settings.friends.wrapped.confirmMail', { name: guest.name }))) {
                          mail(guest.email, 'wrapped')
                        } else if (action === 'copy') {
                          copyLink(guest.email)
                        } else if (action === 'renew' && window.confirm(t('settings.friends.wrapped.confirmRenew', { email: guest.email }))) {
                          copyLink(guest.email, true)
                        }
                      }}
                    >
                      <option value='' hidden={true}>{t('settings.friends.wrapped.menu')}</option>
                      <optgroup label={t('settings.friends.wrapped.menu')}>
                        <option value='mail' disabled={!mailable}>{t('settings.friends.wrapped.mail')}</option>
                        <option value='copy'>{t('settings.friends.wrapped.copy')}</option>
                        <option value='renew' disabled={!wrapped?.[guest.email]?.wrapped_token}>{t('settings.friends.wrapped.renew')}</option>
                      </optgroup>
                    </select>
                  </label>
                  <button
                    type='button'
                    sx={Friends.styles.remove}
                    title={t('settings.friends.remove.label', { name: guest.name })}
                    aria-label={t('settings.friends.remove.label', { name: guest.name })}
                    onClick={() => {
                      if (window.confirm(t('settings.friends.remove.confirm', { email: guest.email }))) {
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
            <p><small><Trans t={t} i18nKey='settings.friends.wrapped.retry' components={[<button type='button' sx={Friends.styles.retry} onClick={fetchWrapped} />]} /></small></p>
          )}
          {!mailable && (
            <p><small><Trans t={t} i18nKey='settings.friends.setupMail' components={[<Link to='/settings/mail' />]} /></small></p>
          )}
          <Invitation mailable={mailable}>
            <div sx={{ marginTop: 4 }}>
              <Option type='checkbox' id='guests.public' checked={open} disabled={!server} onChange={(e: any) => setPublic(e.target.checked)}>
                <div sx={{ lineHeight: 'normal', paddingY: 10 }}>
                  <strong>{emojize('🌍', t('settings.friends.public.label'))}</strong>
                  <br />
                  <small>{server ? t('settings.friends.public.help') : t('settings.friends.public.noPlex')}</small>
                </div>
              </Option>
            </div>
            {(open || !server) && (
              <form onSubmit={invite} sx={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4, marginBottom: 6 }}>
                <input type='email' id='invitation-to' aria-label={t('settings.friends.invite.to')} placeholder={t('settings.friends.invite.placeholder')} value={invitee} onChange={(e) => setInvitee(e.target.value)} required={true} sx={{ variant: 'input.default', fontFamily: 'monospace', flex: 1, minWidth: 0 }} />
                <Button type='submit' color='primary' disabled={!mailable || inviting} aria-busy={inviting} title={mailable ? undefined : t('settings.invitation.setupMail')}>{t('settings.invitation.invite')}</Button>
              </form>
            )}
            {!!invited.length && (
              <p aria-live='polite'><small>{t('settings.friends.invite.done', { emails: invited.join(', ') })}</small></p>
            )}
          </Invitation>
          <h3>{t('settings.friends.wrapped.title')}</h3>
          <p>{t('settings.friends.wrapped.help')}</p>
          <WrappedLooks form={looks} onSave={onSave} />
        </article>
      </section>
    </Body>
  )
}

// A linked friend wears a thin Plex ring and the Plex chevron, a disconnected one the reconnect mails sent since their
// token died, the first one and its 3 reminders, as four arcs filled in red once sent, and a grey chevron
const Avatar = ({ guest, sent = {} }: { guest: any, sent?: any }) => {
  const { t } = useTranslation()
  const linked = guest.plex_token_valid !== false
  const at = sent.reconnect_mailed_at || guest.reconnect_mailed_at
  const count = linked ? 0 : Math.min(Math.max(sent.reconnect_mails ?? guest.reconnect_mails ?? 0, at ? 1 : 0), 4)
  const stopped = guest.mail_unsubscribed?.includes('reconnect')
  const checked = guest.plex_token_checked_at ? t('settings.friends.avatar.checked', { day: dayOf(guest.plex_token_checked_at) }) : ''
  const label = linked
    ? t('settings.friends.avatar.linked', { checked })
    : t('settings.friends.avatar.disconnected', { checked, count, last: at ? t('settings.friends.avatar.last', { day: dayOf(at) }) : '', stopped: stopped ? t('settings.friends.avatar.stopped') : '' })
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
