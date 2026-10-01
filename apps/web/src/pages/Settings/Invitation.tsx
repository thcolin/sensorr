import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Bulk, Button, Icon, Link, Option } from '@sensorr/ui'
import { useAPI } from '../../store/api'
import { errorOf } from './Mail'

const dayOf = (timestamp) => new Date(timestamp).toLocaleDateString('en-GB', {
  day: 'numeric',
  month: 'short',
  ...(new Date(timestamp).getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}),
})

const activityOf = ({ plays, seen_at }) => !seen_at
  ? 'never seen'
  : `seen ${dayOf(seen_at)} · ${plays.toLocaleString('en-GB')} ${plays === 1 ? 'play' : 'plays'}`

export const Invitation = ({ mailable }: { mailable: boolean }) => {
  const api = useAPI()
  const [shared, setShared] = useState(null)
  const [failed, setFailed] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [sending, setSending] = useState<string[]>([])

  const fetchShared = useCallback(() => {
    setFailed(false)
    const { uri, params, init } = api.query.guests.getShared()
    api.fetch(uri, params, init)
      .then(setShared)
      .catch((err) => {
        console.warn(err)
        setFailed(true)
      })
  }, [])

  useEffect(fetchShared, [])

  const invite = async (people) => {
    const emails = people.map(({ email }) => email)
    setSending((sending) => [...sending, ...emails])

    try {
      const { uri, params, init } = api.query.mail.postInvitation({ body: { to: people.map(({ email, name }) => ({ email, name })) } })
      const results = await api.fetch(uri, params, init, { rawError: true })
      const invited = Object.fromEntries(results.filter(({ invited_at }) => invited_at).map(({ email, invited_at }) => [email, invited_at]))
      const errors = results.filter(({ error }) => error)
      setShared((shared) => ({ ...shared, results: shared.results.map((person) => invited[person.email] ? { ...person, invited_at: invited[person.email] } : person) }))
      setSelected((selected) => selected.filter((email) => !invited[email]))

      if (!errors.length) {
        toast.success(people.length === 1 ? `Invitation sent to "${people[0].email}"` : `Invited ${people.length} friends`)
      } else if (errors.length === 1 && people.length === 1) {
        toast.error(errors[0].error)
      } else {
        toast.error(`Invited ${results.length - errors.length} of ${results.length}, ${errors.map(({ email }) => `"${email}"`).join(', ')} failed`)
      }
    } catch (err) {
      toast.error((await errorOf(err)) || 'Error while sending the invitations, try again')
    } finally {
      setSending((sending) => sending.filter((email) => !emails.includes(email)))
    }
  }

  const people = shared?.results || []
  const invitable = people.filter(({ invited_at }) => !invited_at).map(({ email }) => email)

  return (
    <>
      <div sx={Invitation.styles.heading}>
        <h3>Invitation</h3>
        {!!people.length && (
          <Option
            id='invitation-all'
            type='checkbox'
            checked={selected.length !== 0}
            disabled={!mailable || !!sending.length || (!selected.length && !invitable.length)}
            onChange={() => setSelected(selected.length === 0 ? invitable : [])}
          >
            {selected.length === 0 ? 'Select All' : `${selected.length} Selected`}
          </Option>
        )}
      </div>
      <p sx={{ lineHeight: 'body' }}>
        Your friend gets a mail asking them to link their Plex account from <a href={`${document.location.origin}/keep-in-touch`} target='_blank' rel='noreferer noopener'>{document.location.origin}/keep-in-touch</a>.
        {shared?.plex && ' Here are the people your Plex server is shared with who are not guests yet.'}
      </p>
      {!shared && !failed && (
        <div>
          <Icon value='spinner' />
        </div>
      )}
      {failed && (
        <p><small>Unable to read who your Plex server is shared with, <button type='button' sx={Invitation.styles.retry} onClick={fetchShared}>retry</button></small></p>
      )}
      {shared && !shared.plex && (
        <p><small>Set up <Link to='/settings/plex'>Plex</Link> to list the people your Plex server is shared with.</small></p>
      )}
      {shared?.plex && !people.length && (
        <p sx={{ textAlign: 'center' }}>Everyone your Plex server is shared with is a guest</p>
      )}
      {!!people.length && (
        <ul sx={Invitation.styles.people}>
          {people.map((person) => (
            <li key={person.email} sx={Invitation.styles.person}>
              <Option
                id={`invitation-${person.email}`}
                type='checkbox'
                aria-label={person.invited_at ? `${person.name} was invited, invite them again one by one` : `Select ${person.name}`}
                checked={selected.includes(person.email)}
                disabled={!mailable || !!person.invited_at || sending.includes(person.email)}
                onChange={(e: any) => setSelected((selected) => e.target.checked ? [...selected, person.email] : selected.filter((email) => email !== person.email))}
              />
              <Face person={person} />
              <div sx={Invitation.styles.who}>
                <span><strong>{person.name}</strong> <small>{person.email}</small></span>
                {shared.tautulli && <small>{activityOf(person)}</small>}
              </div>
              {person.invited_at ? (
                <button
                  type='button'
                  sx={Invitation.styles.again}
                  title={mailable ? `Invite ${person.name} again` : 'Set up Mail first'}
                  aria-label={`Invited ${dayOf(person.invited_at)}, invite ${person.name} again`}
                  aria-disabled={!mailable || sending.includes(person.email) || undefined}
                  aria-busy={sending.includes(person.email)}
                  onClick={() => {
                    if (mailable && !sending.includes(person.email) && confirm(`${person.name} was invited on ${dayOf(person.invited_at)}. Invite them again ?`)) {
                      invite([person])
                    }
                  }}
                >
                  <span>Invited {dayOf(person.invited_at)}</span>
                  <span>Invite again</span>
                </button>
              ) : (
                <Button
                  type='button'
                  color='primary'
                  disabled={!mailable || sending.includes(person.email)}
                  aria-busy={sending.includes(person.email)}
                  title={mailable ? undefined : 'Set up Mail first'}
                  onClick={() => invite([person])}
                >
                  Invite
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {shared?.plex && !shared.tautulli && !!people.length && (
        <p><small>Set up <Link to='/settings/tautulli'>Tautulli</Link> to see who watches the most, first.</small></p>
      )}
      <Bulk
        count={selected.length}
        disabled={!!sending.length}
        actions={[{
          key: 'invite',
          icon: '✉️',
          label: 'Invite',
          onClick: () => {
            if (confirm(`Invite ${selected.length} ${selected.length === 1 ? 'friend' : 'friends'} by mail ?`)) {
              invite(people.filter(({ email }) => selected.includes(email)))
            }
          },
        }]}
      />
    </>
  )
}

const Face = ({ person }) => {
  const [broken, setBroken] = useState(false)

  return (
    <span sx={Invitation.styles.face}>
      {person.avatar && !broken ? <img src={person.avatar} alt='' onError={() => setBroken(true)} /> : <span>{(person.name || person.email || '?')[0]}</span>}
    </span>
  )
}

Invitation.styles = {
  heading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    fontVariantNumeric: 'tabular-nums',
  },
  // Scrolls on its own without pulling the page along
  people: {
    listStyle: 'none',
    margin: '0px',
    marginTop: 4,
    padding: '0px',
    maxHeight: 'calc(8 * 56px)',
    overflowY: 'auto',
    overscrollBehavior: 'contain',
    border: '1px solid',
    borderColor: 'grayLight',
  },
  person: {
    display: 'grid',
    gridTemplateColumns: 'auto auto minmax(0, 1fr) auto',
    alignItems: 'center',
    columnGap: 6,
    minHeight: '56px',
    paddingY: 10,
    paddingX: 10,
    borderBottom: '1px solid',
    borderColor: 'grayLight',
    ':last-of-type': {
      borderBottom: 'none',
    },
    '>label': {
      marginY: '0px',
    },
  },
  face: {
    display: 'grid',
    '>img, >span': {
      width: '34px',
      height: '34px',
      borderRadius: '50%',
      objectFit: 'cover',
    },
    '>span': {
      display: 'grid',
      placeItems: 'center',
      backgroundColor: 'gray',
      color: 'grayDarkest',
      fontFamily: 'heading',
      fontWeight: 'heading',
      textTransform: 'uppercase',
    },
  },
  who: {
    minWidth: '0px',
    lineHeight: 'normal',
    '>span, >small': {
      display: 'block',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    small: {
      color: 'grayDarkest',
      fontVariantNumeric: 'tabular-nums',
    },
  },
  // The date of the last invitation, which turns into the way to send it again
  again: {
    variant: 'button.reset',
    paddingX: 8,
    paddingY: 10,
    fontSize: 6,
    color: 'grayDarkest',
    whiteSpace: 'nowrap',
    fontVariantNumeric: 'tabular-nums',
    '>span:last-of-type': {
      display: 'none',
    },
    ':hover:not([aria-disabled]), :focus-visible:not([aria-disabled])': {
      color: 'primary',
      '>span:first-of-type': {
        display: 'none',
      },
      '>span:last-of-type': {
        display: 'inline',
      },
    },
    '&[aria-disabled]': {
      cursor: 'default',
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
