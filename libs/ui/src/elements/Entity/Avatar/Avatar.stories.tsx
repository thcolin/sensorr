import { Meta } from '@storybook/react'
import { Avatar as UIAvatar } from './Avatar'
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

const overrides = {
  none: {},
  loading: { ready: false },
}

export default { component: UIAvatar, title: 'Elements / Entity / Avatar' } as Meta

export const Avatar = (args: any) =>
<UIAvatar {...args} />

Avatar.args = {
  details: details.movie,
  link: '/movie/1',
  overrides: overrides.none,
}

Avatar.argTypes = {
  details: {
    control: {
      type: 'select',
      options: details,
    },
  },
  overrides: {
    control: {
      type: 'select',
      options: overrides,
    },
  },
  onHover: {
    control: {
      type: null,
    },
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
  <UIAvatar {...args}
    hover={null}
    link={''}
    highlight={false}
    overrides={overrides.loading}
  />
)

export const Movie = (args: any) => (
  <UIAvatar {...args}
    details={details.movie}
    link={'/movie/1'}
    highlight={false}
    overrides={overrides.none}
  />
)

export const MovieHighlight = (args: any) => (
  <UIAvatar {...args}
    details={details.movie}
    link={'/movie/1'}
    highlight={true}
    overrides={overrides.none}
  />
)

export const Person = (args: any) => (
  <UIAvatar {...args}
    details={details.person}
    link={'/person/1'}
    highlight={false}
    overrides={overrides.none}
  />
)

export const PersonHighlight = (args: any) => (
  <UIAvatar {...args}
    details={details.person}
    link={'/person/1'}
    highlight={true}
    overrides={overrides.none}
  />
)

export const Crew = (args: any) => (
  <UIAvatar {...args}
    details={details.crew}
    link={'/person/1'}
    highlight={false}
    overrides={overrides.none}
  />
)

export const CrewHighlight = (args: any) => (
  <UIAvatar {...args}
    details={details.crew}
    link={'/person/1'}
    highlight={true}
    overrides={overrides.none}
  />
)

export const Cast = (args: any) => (
  <UIAvatar {...args}
    details={details.cast}
    link={'/person/1'}
    highlight={false}
    overrides={overrides.none}
  />
)

export const CastHighlight = (args: any) => (
  <UIAvatar {...args}
    details={details.cast}
    link={'/person/1'}
    highlight={true}
    overrides={overrides.none}
  />
)

// export const Collection = (args: any) => (
//   <UIAvatar {...args}
//     details={details.collection}
//     link={'/person/1'}
//     state={state.followed}
//     overrides={overrides.none}
//   />
// )
