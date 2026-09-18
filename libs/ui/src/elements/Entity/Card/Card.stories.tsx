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
  loading: transformMovieDetails({ id: null, poster_path: false } as any),
}

const state = {
  loading: { component: Badge, props: { emoji: '⌛', compact: true } },
  ignored: { component: Badge, props: { emoji: '🔕', compact: true } },
  missing: { component: Badge, props: { emoji: '💊', compact: true } },
  pinned: { component: Badge, props: { emoji: '📍', compact: true } },
  wished: { component: Badge, props: { emoji: '🍿', compact: true } },
  archived: { component: Badge, props: { emoji: '📼', compact: true } },
  followed: { component: Badge, props: { emoji: '🔔', compact: true } },
}

export default { component: UICard, title: 'Elements / Entity / Card' }

export const Card = (args: any) =>
<UICard {...args} />

Card.args = {
  details: details.movie,
  link: '/movie/1',
  badges: { state: state.wished },
}

Card.argTypes = {
  details: {
    control: {
      type: 'select',
      options: details,
    }
  },
  badges: {
    control: {
      type: 'select',
      options: state,
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
    details={details.loading}
    link={''}
    ready={false}
  />
)

export const Movie = (args: any) => (
  <UICard {...args}
    details={details.movie}
    link={'/movie/1'}
    badges={{ state: state.wished }}
  />
)

export const Person = (args: any) => (
  <UICard {...args}
    details={details.person}
    link={'/person/1'}
    badges={{ state: state.followed }}
  />
)

// export const Collection = (args: any) => (
//   <UICard {...args}
//     details={details.collection}
//     link={'/person/1'}
//     badges={{ state: state.followed }}
//   />
// )
