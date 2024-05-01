import { memo } from 'react'
import { useDevice } from '@sensorr/utils'
import { List } from '../../../elements/List/List'
import { Person } from '../../Person/Person'

const Credit = ({ index, entities, ...props }) => (
  <div sx={{ position: 'relative', zIndex: 0, '&:hover': { zIndex: 1 } }}>
    <Person
      {...props}
      display='avatar'
      entity={entities[index]?.entity}
      link={(entity) => ({ to: entity?.id && `/person/${entity?.id}` })}
      state={entities[index]?.state}
    />
  </div>
)

const UICredits = ({ credits, length = 0, hidden = false, space = null, ...props }) => {
  const device = useDevice()

  return (
    <List
      id='credits'
      length={Math.min(length || 5, credits?.length)}
      child={Credit}
      childProps={{ entities: credits }}
      entities={credits}
      compact={true}
      space={space || (device === 'mobile' ? 3 : 4)}
      virtual={false}
      stack={true}
    />
  )
}

export const Credits = memo(UICredits)
