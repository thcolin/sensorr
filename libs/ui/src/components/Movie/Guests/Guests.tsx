import { memo } from 'react'
import { useDevice } from '@sensorr/utils'
import { List } from '../../../elements/List/List'
import { Person } from '../../Person/Person'

const Guest = ({ index, entities, ...props }) => (
  <div sx={{ position: 'relative', zIndex: 0, '&:hover': { zIndex: 1 } }}>
    <Person
      {...props}
      display='avatar'
      entity={entities[index]?.entity}
      compact={false}
      link={() => ({
        to: '/movie/requests',
        state: {
          controls: {
            state: 'archived|wished|pinned|missing|ignored',
            requested_by: { values: [entities[index]?.entity.override], behavior: 'and' },
          },
        },
      })}
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
      link={() => ({
        to: '/movie/requests',
        state: {
          controls: {
            state: 'archived|wished|pinned|missing|ignored',
            requested_by: { values: [entities[index]?.entity.override], behavior: 'and' },
          },
        },
      })}
    />
  </div>
)

const UIGuests = ({ guests, compact = true, hidden = false, space = null, ...props }) => {
  const device = useDevice()

  return (
    <List
      id='guests'
      length={Math.min(5, guests?.length)}
      child={compact ? CompactGuest : Guest}
      childProps={{ ...props?.childProps, entities: guests }}
      entities={guests}
      compact={true}
      space={space || (device === 'mobile' ? 2 : 3)}
    />
  )
}

export const Guests = memo(UIGuests)
