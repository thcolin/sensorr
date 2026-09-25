import { memo } from 'react'
import { useDevice } from '@sensorr/utils'
import { List } from '../../../elements/List/List'
import { Person } from '../../Person/Person'

const Guest = ({ index, entities, to, ...props }) => (
  <div sx={{ position: 'relative', zIndex: 0, '&:hover': { zIndex: 1 } }}>
    <Person
      {...props}
      display='avatar'
      entity={entities[index]?.entity}
      compact={false}
      link={() => ({
        to,
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

const CompactGuest = ({ index, entities, to, ...props }) => (
  <div sx={{ position: 'relative', zIndex: 0, '&:hover': { zIndex: 1 } }}>
    <Person
      {...props}
      display='avatar'
      entity={entities[index]?.entity}
      compact={true}
      link={() => ({
        to,
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

// `to` is the requests page of the entity's branch, the movies one unless a show says otherwise
const UIGuests = ({ guests, compact = true, hidden = false, space = null, to = '/movie/requests', ...props }) => {
  const device = useDevice()

  return (
    <List
      id='guests'
      length={Math.min(5, guests?.length)}
      child={compact ? CompactGuest : Guest}
      childProps={{ ...props?.childProps, entities: guests, to }}
      entities={guests}
      compact={true}
      space={space || (device === 'mobile' ? 2 : 3)}
      virtual={false}
      stack={true}
    />
  )
}

export const Guests = memo(UIGuests)
