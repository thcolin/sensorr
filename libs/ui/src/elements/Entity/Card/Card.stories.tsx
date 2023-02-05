import { Meta } from '@storybook/react'
import { Card as UICard } from './Card'
import { Badge } from '../../../atoms/Badge/Badge'
import { transformMovieDetails } from '../../../components/Movie/Movie'
import { transformPersonDetails } from '../../../components/Person/Person'
import { fixtures } from '@sensorr/tmdb'

const details = {
  movie: transformMovieDetails(fixtures.movie),
  person: transformPersonDetails(fixtures.person),
  cast: transformPersonDetails(fixtures.cast),
  crew: transformPersonDetails(fixtures.crew),
}

const state = {
  loading: <Badge emoji='⌛' compact={true} />,
  ignored: <Badge emoji='🔕' compact={true} />,
  missing: <Badge emoji='💊' compact={true} />,
  pinned: <Badge emoji='📍' compact={true} />,
  wished: <Badge emoji='🍿' compact={true} />,
  archived: <Badge emoji='📼' compact={true} />,
  followed: <Badge emoji='🔔' compact={true} />,
}

const overrides = {
  none: {},
  loading: { ready: false },
}

export default { component: UICard, title: 'Elements / Entity / Card' } as Meta

export const Card = (args: any) =>
<UICard {...args} />

Card.args = {
  details: details.movie,
  link: '/movie/1',
  state: state.wished,
  overrides: overrides.none,
}

Card.argTypes = {
  details: {
    control: {
      type: 'select',
      options: details,
    }
  },
  state: {
    control: {
      type: 'select',
      options: state,
    }
  },
  overrides: {
    control: {
      type: 'select',
      options: overrides,
    }
  },
  palette: {
    control: {
      type: null,
    },
  },
  empty: {
    control: {
      type: null,
    },
  },
}

export const Loading = (args: any) => (
  <UICard {...args}
    link={''}
    state={null}
    overrides={overrides.loading}
  />
)

export const Movie = (args: any) => (
  <UICard {...args}
    details={details.movie}
    link={'/movie/1'}
    state={state.wished}
    overrides={overrides.none}
  />
)

export const Person = (args: any) => (
  <UICard {...args}
    details={details.person}
    link={'/person/1'}
    state={state.followed}
    overrides={overrides.none}
  />
)

// export const Collection = (args: any) => (
//   <UICard {...args}
//     details={details.collection}
//     link={'/person/1'}
//     state={state.followed}
//     overrides={overrides.none}
//   />
// )
