import { ReactNode, useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Bar, Bulk, Button, Link, Option } from '@sensorr/ui'
import { useAPI, errorOf } from '../../store/api'
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

export const Invitation = ({ mailable, children }: { mailable: boolean, children?: ReactNode }) => {
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
      <h3>Invitation</h3>
      <p sx={{ lineHeight: 'body' }}>
        Your friend gets a mail asking them to link their Plex account from <a href={`${document.location.origin}/keep-in-touch`} target='_blank' rel='noreferrer noopener'>{document.location.origin}/keep-in-touch</a>.
      </p>
      {children}
      <div sx={Invitation.styles.heading}>
        <p>People your Plex server is shared with who are not guests yet</p>
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
      <div sx={Invitation.styles.people}>
        {!shared && !unreachable && (
          <ul sx={Invitation.styles.list} aria-hidden={true}>
            {[[6, 12], [7.5, 14], [5, 11]].map(([name, email], index) => (
              <li key={index} sx={Invitation.styles.person}>
                <Bar width='1.25em' height='1.25em' />
                <Bar width='34px' height='34px' radius='50%' />
                <span sx={{ display: 'flex', gap: 6 }}>
                  <Bar width={`${name}em`} height='0.875em' />
                  <Bar width={`${email}em`} height='0.75em' />
                </span>
              </li>
            ))}
          </ul>
        )}
        {unreachable && (
          <p sx={Invitation.styles.state}><small>Unable to read who your Plex server is shared with, <button type='button' sx={Invitation.styles.retry} onClick={fetchShared}>retry</button></small></p>
        )}
        {shared && !shared.plex && (
          <p sx={Invitation.styles.state}><small>Set up <Link to='/settings/plex'>Plex</Link> to list the people your Plex server is shared with.</small></p>
        )}
        {shared?.plex && !people.length && (
          <p sx={Invitation.styles.state}>Everyone your Plex server is shared with is a guest</p>
        )}
        {!!people.length && (
          <ul sx={Invitation.styles.list}>
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
                    if (mailable && (!person.invited_at || window.confirm(`${person.name} was invited on ${dayOf(person.invited_at)}. Invite them again ?`))) {
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
      </div>
      {shared?.plex && !shared.tautulli && !!people.length && (
        <p><small>{config.get('tautulli.url')
          ? <>No Tautulli activity imported yet, the <Link to='/settings/schedule'>wrapped</Link> job imports it to show who watched most recently first.</>
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
            if (window.confirm(`Invite ${selected.length} ${selected.length === 1 ? 'friend' : 'friends'} by mail ?`)) {
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
    fontSize: '0.75em',
    color: 'grayDarkest',
    fontVariantNumeric: 'tabular-nums',
    '>:last-child:not(p)': {
      flexShrink: 0,
      whiteSpace: 'nowrap',
    },
  },
  // Same height whatever it holds, and scrolls on its own without pulling the page along
  people: {
    height: 'calc(8 * 56px)',
    overflowY: 'auto',
    overscrollBehavior: 'contain',
    border: '1px solid',
    borderColor: 'grayLight',
  },
  list: {
    listStyle: 'none',
    margin: '0px',
    padding: '0px',
  },
  state: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    margin: '0px',
    padding: 10,
    textAlign: 'center',
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
