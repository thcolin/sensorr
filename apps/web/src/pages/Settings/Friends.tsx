import { useState } from 'react'
import toast from 'react-hot-toast'
import { Button, Icon, Link } from '@sensorr/ui'
import { useGuestsContext } from '../../contexts/Guests/Guests'

const Friends = ({ ...props }) => {
  const { loading, guests, deleteGuest } = useGuestsContext() as any
  const [invitation, setInvitation] = useState(
    `Someone wonderful want to follow your Plex "Watchlist" and consider your movie wishes !\n` +
    `To accept his invitation, link your Plex account with Sensorr server by following quick instructions,\n` +
    `${document.location.origin}/keep-in-touch` + `\n`
  )

  return (
    <div sx={Friends.styles.element}>
      <section>
        <h2>Friends</h2>
        <p sx={{ lineHeight: 'body' }}>
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
            <div>
              <img src={guest.avatar} />
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
      </section>
    </div>
  )
}

Friends.styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    alignItems: 'center',
    paddingX: 2,
    paddingBottom: 0,
    code: {
      variant: 'code.tag',
    },
    p: {
      marginY: 8,
    },
    h3: {
      marginY: 8,
    },
    a: {
      color: 'primary',
      ':hover': {
        color: 'accent',
      },
    },
    section: {
      width: '100%',
      paddingX: 4,
      maxWidth: '96rem',
    },
  },
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
        marginX: 4,
      },
      '>button': {
        flex: 0,
      },
    }
  }
}

export default Friends
