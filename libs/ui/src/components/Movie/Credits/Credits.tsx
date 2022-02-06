import { memo } from 'react'
import { animations } from '@sensorr/theme'
import { List } from '../../../elements/List/List'
import { Person } from '../../Person/Person'

const Credit = ({ index, entities, ...props }) => (
  <Person
    {...props}
    display='avatar'
    entity={entities[index]?.entity}
    link={(entity) => entity?.id && `/person/${entity?.id}`}
    state={entities[index]?.state}
  />
)

const UICredits = ({ credits, display, hidden, ...props }) => (
  <div
    sx={{
      fontSize: 9,
      margin: { pretty: '0 -4em -5em 0', poster: '0 0 -3em -3em' }[display],
      opacity: ((credits || []).every(credit => (credit.entity.profile_path as any) !== false) || !hidden) ? 1 : 0,
      animation: (credits || []).every(credit => (credit.entity.profile_path as any) === false) && !hidden ? `${animations.pulse} 1.25s ease infinite` : 'none',
      transition: 'opacity 400ms ease-in-out',
    }}
  >
    <List
      length={Math.min({ pretty: 6, poster: 4 }[display] || 0, credits?.length)}
      child={Credit}
      childProps={{ entities: credits }}
      entities={credits}
      compact={true}
    />
  </div>
)

export const Credits = memo(UICredits)
