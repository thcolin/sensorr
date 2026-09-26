import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Button, Icon, Link } from '@sensorr/ui'
import { useGuestsContext } from '../../contexts/Guests/Guests'
import { useAPI } from '../../store/api'
import Body from '../../layout/Body/Body'
import { useTitle } from '@sensorr/utils'

const linkOf = (token) => `${document.location.origin}/wrapped/${token}`

const Friends = ({ ...props }) => {
  useTitle('Settings - Friends')
  const api = useAPI()
  const { loading, guests, deleteGuest } = useGuestsContext() as any
  const [wrapped, setWrapped] = useState(null)
  const [wrappedError, setWrappedError] = useState(false)
  const [busy, setBusy] = useState({})

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
  const [invitation, setInvitation] = useState(
    `Someone wonderful want to follow your Plex "Watchlist" and consider your movie wishes !\n` +
    `To accept his invitation, link your Plex account with Sensorr server by following quick instructions,\n` +
    `${document.location.origin}/keep-in-touch` + `\n`
  )

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
                  <h5 title='wrapped'>🎞️<span>&nbsp;wrapped</span></h5>
                  <p data-muted={!(wrapped?.[guest.email]?.viewer && wrapped[guest.email].wrapped_token) || undefined}>
                    {wrappedError ? (
                      <span>Unable to load the wrapped links, <button type='button' sx={Friends.styles.retry} onClick={fetchWrapped}>retry</button></span>
                    ) : !wrapped ? (
                      <span aria-busy={true}>Looking for them in Tautulli...</span>
                    ) : !wrapped[guest.email]?.viewer ? (
                      <span>No Tautulli user with this email</span>
                    ) : wrapped[guest.email].wrapped_token ? (
                      <span>{linkOf(wrapped[guest.email].wrapped_token)}</span>
                    ) : (
                      <span>No link yet</span>
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
                </footer>
              </div>
            ))}
          </div>
          <h3>Invitation</h3>
          <p sx={{ lineHeight: 'body' }}>
            Copy below invitation, send it to your friends and let them surprise you with their requests !
            <small>
              <br/>
              Guest will be asked to <strong>link</strong> their Plex account to Sensorr server from <a href={`${document.location.origin}/keep-in-touch`} target='_blank' rel='noreferer noopener'>{document.location.origin}/keep-in-touch</a>.
            </small>
          </p>
          <div sx={{ display: 'flex', flexDirection: 'column', marginTop: 4 }}>
            <textarea
              sx={{ variant: 'textarea.default', flex: 1 }}
              rows={4}
              onChange={e => setInvitation(e.currentTarget.value)}
              value={invitation}
            />
            <Button
              type='button'
              color='primary'
              variant='contain'
              sx={{ marginTop: 4 }}
              onClick={() => {
                navigator.clipboard.writeText(invitation)
                toast.success('Invitation copied to Clipboard')
              }}
            >
              Copy Invitation to Clipboard
            </Button>
          </div>
        </article>
      </section>
    </Body>
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
    alignItems: 'stretch',
    flex: '1 1 100%',
    marginTop: 6,
    border: '1px solid',
    borderColor: 'grayDark',
    borderRadius: '0.25rem',
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
      '&[data-muted]': {
        fontFamily: 'body',
        color: 'grayDarkest',
      },
      '>span': {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
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
    },
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
