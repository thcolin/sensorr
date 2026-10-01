import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Bulk, Button, Icon, Link, Option } from '@sensorr/ui'
import { useAPI } from '../../store/api'
import { errorOf } from './Mail'
import { Face } from './Face'
import { useConfigContext } from '../../contexts/Config/Config'

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
  const { config } = useConfigContext()
  const [shared, setShared] = useState(null)
  const [unreachable, setUnreachable] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [sending, setSending] = useState<string[]>([])
  const [failed, setFailed] = useState({})

  const fetchShared = useCallback(() => {
    setUnreachable(false)
    const { uri, params, init } = api.query.guests.getShared()
    api.fetch(uri, params, init)
      .then(setShared)
      .catch((err) => {
        console.warn(err)
        setUnreachable(true)
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
      setFailed((failed) => ({ ...Object.fromEntries(Object.entries(failed).filter(([email]) => !emails.includes(email))), ...Object.fromEntries(errors.map(({ email, error }) => [email, error])) }))

      if (!errors.length) {
        toast.success(people.length === 1 ? `Invitation sent to "${people[0].email}"` : `Invitation sent to ${people.length} friends`)
      } else if (errors.length === 1 && people.length === 1) {
        toast.error(errors[0].error)
      } else {
        toast.error(`Invitation sent to ${results.length - errors.length} of ${results.length} friends, the others are marked in the list`)
      }
    } catch (err) {
      toast.error((await errorOf(err)) || 'Error while sending the invitations, the list shows who got one')
      // The server may have mailed some of them before the request failed
      fetchShared()
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
        Your friend gets a mail asking them to link their Plex account from <a href={`${document.location.origin}/keep-in-touch`} target='_blank' rel='noreferrer noopener'>{document.location.origin}/keep-in-touch</a>.
        {shared?.plex && ' Here are the people your Plex server is shared with who are not guests yet.'}
      </p>
      {!shared && !unreachable && (
        <div>
          <Icon value='spinner' />
        </div>
      )}
      {unreachable && (
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
              <span sx={person.invited_at ? { visibility: 'hidden' } : {}}>
                <Option
                  id={`invitation-${person.email}`}
                  type='checkbox'
                  aria-label={`Select ${person.name}`}
                  checked={selected.includes(person.email)}
                  disabled={!mailable || !!person.invited_at || sending.includes(person.email)}
                  onChange={(e: any) => setSelected((selected) => e.target.checked ? [...selected, person.email] : selected.filter((email) => email !== person.email))}
                />
              </span>
              <Face person={person} />
              <div sx={Invitation.styles.who}>
                <span><strong>{person.name}</strong> <small>{person.email}</small></span>
                {failed[person.email]
                  ? <small data-failed={true}>not sent, {failed[person.email]}</small>
                  : (shared.tautulli || person.invited_at) && <small>{[person.invited_at && `invited ${dayOf(person.invited_at)}`, shared.tautulli && activityOf(person)].filter(Boolean).join(' · ')}</small>}
              </div>
              <Button
                type='button'
                variant='outline'
                color='gray'
                disabled={sending.includes(person.email)}
                // Not `disabled` without Mail, which hides the reason in the title from the hover and from screen readers
                aria-disabled={!mailable || undefined}
                aria-busy={sending.includes(person.email)}
                aria-label={person.invited_at ? `Invite ${person.name} again` : `Invite ${person.name}`}
                title={mailable ? undefined : 'Set up Mail first'}
                onClick={() => {
                  if (mailable && (!person.invited_at || confirm(`${person.name} was invited on ${dayOf(person.invited_at)}. Invite them again ?`))) {
                    invite([person])
                  }
                }}
              >
                {person.invited_at ? 'Again' : 'Invite'}
              </Button>
            </li>
          ))}
        </ul>
      )}
      {shared?.plex && !shared.tautulli && !!people.length && (
        <p><small>{config.get('tautulli.url')
          ? <>No Tautulli activity imported yet, the <Link to='/settings/jobs'>wrapped</Link> job imports it to show who watched most recently first.</>
          : <>Set up <Link to='/settings/tautulli'>Tautulli</Link> to see who watched most recently first.</>}</small></p>
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
    '>button[aria-disabled]': {
      opacity: 0.5,
      cursor: 'default',
    },
    // A target wider than the box itself, the rows are dense
    '>span>label': {
      marginY: '0px',
      padding: '12px',
      margin: '-12px',
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
    'small[data-failed]': {
      color: 'error',
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
