import { memo } from 'react'
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

const UICredits = ({ credits, display, length = 0, hidden = false, ...props }) => (
  <div
    sx={{
      fontSize: 9,
      margin: { pretty: '0 0 -5em -3em', poster: '0 0 -3em -3em' }[display],
      transition: 'opacity 400ms ease-in-out',
    }}
  >
    <List
      id='credits'
      length={Math.min(length || { pretty: 5, poster: 4 }[display] || 0, credits?.length)}
      child={Credit}
      childProps={{ entities: credits }}
      entities={credits}
      compact={true}
    />
  </div>
)

export const Credits = memo(UICredits)
