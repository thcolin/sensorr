import { Pretty as UIPretty } from './Pretty'
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

const focus = {
  date: { component: Badge, props: { emoji: '📅', label: '30/03', compact: true, size: 'small' } },
  popularity: { component: Badge, props: { emoji: '📣', label: '2K', compact: true, size: 'small' } },
  vote_average: { component: Badge, props: { emoji: '👍', label: '6.1', compact: true, size: 'small' } },
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

export default { component: UIPretty, title: 'Elements / Entity / Pretty' }

export const Pretty = (args: any) =>
<UIPretty {...args} />

Pretty.args = {
  details: details.movie,
  link: '/movie/1',
  badges: { state: state.wished },
}

Pretty.argTypes = {
  details: {
    control: {
      type: 'select',
      options: details,
    }
  },
  badges: {
    control: {
      type: 'select',
      options: { focus, state },
    }
  },
  empty: {
    control: {
      type: null,
    },
  },
}

export const Loading = (args: any) => (
  <UIPretty {...args}
    details={details.loading}
    link={''}
    ready={false}
  />
)

export const Movie = (args: any) => (
  <UIPretty {...args}
    details={details.movie}
    link={'/movie/1'}
    badges={{ state: state.wished }}
  />
)

export const MovieWithFocus = (args: any) => (
  <UIPretty {...args}
    details={details.movie}
    link={'/movie/1'}
    badges={{ state: state.archived, focus: focus.vote_average }}
  />
)

export const Person = (args: any) => (
  <UIPretty {...args}
    details={details.person}
    link={'/person/1'}
    badges={{ state: state.followed }}
  />
)

export const PersonWithFocus = (args: any) => (
  <UIPretty {...args}
    details={details.person}
    link={'/person/1'}
    badges={{ state: state.followed, focus: focus.popularity }}
  />
)

export const Cast = (args: any) => (
  <UIPretty {...args}
    details={details.cast}
    link={'/person/1'}
    badges={{ state: state.followed }}
  />
)

export const CastWithFocus = (args: any) => (
  <UIPretty {...args}
    details={details.cast}
    link={'/person/1'}
    badges={{ state: state.followed, focus: focus.popularity }}
  />
)

export const Crew = (args: any) => (
  <UIPretty {...args}
    details={details.crew}
    link={'/person/1'}
    badges={{ state: state.followed }}
  />
)

export const CrewWithFocus = (args: any) => (
  <UIPretty {...args}
    details={details.crew}
    link={'/person/1'}
    badges={{ state: state.followed, focus: focus.popularity }}
  />
)
