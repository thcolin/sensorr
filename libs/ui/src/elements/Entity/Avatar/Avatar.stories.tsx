import { Avatar as UIAvatar } from './Avatar'
import { transformMovieDetails } from '../../../components/Movie/Movie'
import { transformPersonDetails } from '../../../components/Person/Person'
import { fixtures } from '@sensorr/tmdb'

const details = {
  movie: transformMovieDetails(fixtures.movie),
  person: transformPersonDetails(fixtures.person),
  cast: transformPersonDetails(fixtures.cast),
  crew: transformPersonDetails(fixtures.crew),
  loading: transformMovieDetails({ id: null, poster_path: false } as any),
}

export default { component: UIAvatar, title: 'Elements / Entity / Avatar' }

export const Avatar = (args: any) =>
<UIAvatar {...args} />

Avatar.args = {
  details: details.movie,
  link: '/movie/1',
}

Avatar.argTypes = {
  details: {
    control: {
      type: 'select',
      options: details,
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
    details={details.loading}
    link={''}
    highlight={false}
    ready={false}
  />
)

export const Movie = (args: any) => (
  <UIAvatar {...args}
    details={details.movie}
    link={'/movie/1'}
    highlight={false}
  />
)

export const MovieHighlight = (args: any) => (
  <UIAvatar {...args}
    details={details.movie}
    link={'/movie/1'}
    highlight={true}
  />
)

export const Person = (args: any) => (
  <UIAvatar {...args}
    details={details.person}
    link={'/person/1'}
    highlight={false}
  />
)

export const PersonHighlight = (args: any) => (
  <UIAvatar {...args}
    details={details.person}
    link={'/person/1'}
    highlight={true}
  />
)

export const Crew = (args: any) => (
  <UIAvatar {...args}
    details={details.crew}
    link={'/person/1'}
    highlight={false}
  />
)

export const CrewHighlight = (args: any) => (
  <UIAvatar {...args}
    details={details.crew}
    link={'/person/1'}
    highlight={true}
  />
)

export const Cast = (args: any) => (
  <UIAvatar {...args}
    details={details.cast}
    link={'/person/1'}
    highlight={false}
  />
)

export const CastHighlight = (args: any) => (
  <UIAvatar {...args}
    details={details.cast}
    link={'/person/1'}
    highlight={true}
  />
)

// export const Collection = (args: any) => (
//   <UIAvatar {...args}
//     details={details.collection}
//     link={'/person/1'}
//     highlight={false}
//   />
// )
