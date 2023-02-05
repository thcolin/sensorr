import { memo } from 'react'
import { List } from '../../../elements/List/List'
import { Person } from '../../Person/Person'

const guestLink = (entity) => ({
  to: '/movie/requests',
  state: {
    controls: {
      requested_by: { values: [entity.email], behavior: 'and' },
    },
  },
})

const Guest = ({ index, entities, ...props }) => (
  <div sx={{ position: 'relative', zIndex: 0, '&:hover': { zIndex: 1 } }}>
    <Person
      {...props}
      display='avatar'
      entity={entities[index]?.entity}
      compact={false}
      link={guestLink}
    />
  </div>
)

const CompactGuest = ({ index, entities, ...props }) => (
  <div sx={{ position: 'relative', zIndex: 0, '&:hover': { zIndex: 1 } }}>
    <Person
      {...props}
      display='avatar'
      entity={entities[index]?.entity}
      compact={true}
      link={guestLink}
    />
  </div>
)

const UIGuests = ({ guests, compact = true, hidden = false, ...props }) => (
  <div
    sx={{
      fontSize: 9,
      margin: '0 -2em -3em 0',
      transition: 'opacity 400ms ease-in-out',
    }}
  >
    <List
      id='guests'
      length={Math.min(4 || 0, guests?.length)}
      child={compact ? CompactGuest : Guest}
      childProps={{ entities: guests }}
      entities={guests}
      compact={true}
      space={2}
    />
  </div>
)

export const Guests = memo(UIGuests)
