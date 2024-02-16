import { Meta } from '@storybook/react'
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
}

const focus = {
  none: null,
  date: <Badge emoji='📅' label='30/03' compact={true} size='small' />,
  popularity: <Badge emoji='📣' label='2K' compact={true} size='small' />,
  vote_average: <Badge emoji='👍' label='6.1' compact={true} size='small' />,
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

const actions = {
  none: null,
  policy: [<Badge emoji='🇫🇷' size='small' compact={true} />],
}

const relations = {
  none: null,
  loading: null,
  credits: null,
}

const overrides = {
  none: { focus: null },
  focus: { focus: <Badge emoji='📣' label='2K' compact={true} size='small' /> },
  loading: { ready: false },
}

export default { component: UIPretty, title: 'Elements / Entity / Pretty' } as Meta

export const Pretty = (args: any) =>
<UIPretty {...args} />

Pretty.args = {
  details: details.movie,
  link: '/movie/1',
  focus: focus.none,
  state: state.wished,
  relations: relations.none,
  overrides: overrides.none,
}

Pretty.argTypes = {
  details: {
    control: {
      type: 'select',
      options: details,
    }
  },
  focus: {
    control: {
      type: 'select',
      options: focus,
    }
  },
  state: {
    control: {
      type: 'select',
      options: state,
    }
  },
  actions: {
    control: {
      type: 'select',
      options: actions,
    }
  },
  relations: {
    control: {
      type: 'select',
      options: relations,
    }
  },
  overrides: {
    control: {
      type: 'select',
      options: overrides,
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
    link={''}
    focus={null}
    state={null}
    relations={null}
    overrides={overrides.loading}
  />
)

export const Movie = (args: any) => (
  <UIPretty {...args}
    details={details.movie}
    link={'/movie/1'}
    focus={focus.none}
    state={state.wished}
    relations={relations.none}
    overrides={overrides.none}
  />
)

export const MovieWithFocus = (args: any) => (
  <UIPretty {...args}
    details={details.movie}
    link={'/movie/1'}
    focus={focus.vote_average}
    state={state.archived}
    relations={relations.none}
    overrides={overrides.none}
  />
)

export const MovieWithForceFocus = (args: any) => (
  <UIPretty {...args}
    details={details.movie}
    link={'/movie/1'}
    focus={focus.vote_average}
    state={state.archived}
    relations={relations.none}
    overrides={overrides.focus}
  />
)

export const Person = (args: any) => (
  <UIPretty {...args}
    details={details.person}
    link={'/person/1'}
    focus={focus.none}
    state={state.followed}
    relations={relations.none}
    overrides={overrides.none}
  />
)

export const PersonWithFocus = (args: any) => (
  <UIPretty {...args}
    details={details.person}
    link={'/person/1'}
    focus={focus.popularity}
    state={state.followed}
    relations={relations.none}
    overrides={overrides.none}
  />
)

export const Cast = (args: any) => (
  <UIPretty {...args}
    details={details.cast}
    link={'/person/1'}
    focus={focus.none}
    state={state.followed}
    relations={relations.none}
    overrides={overrides.none}
  />
)

export const CastWithFocus = (args: any) => (
  <UIPretty {...args}
    details={details.cast}
    link={'/person/1'}
    focus={focus.popularity}
    state={state.followed}
    relations={relations.none}
    overrides={overrides.none}
  />
)

export const Crew = (args: any) => (
  <UIPretty {...args}
    details={details.crew}
    link={'/person/1'}
    focus={focus.none}
    state={state.followed}
    relations={relations.none}
    overrides={overrides.none}
  />
)

export const CrewWithFocus = (args: any) => (
  <UIPretty {...args}
    details={details.crew}
    link={'/person/1'}
    focus={focus.popularity}
    state={state.followed}
    relations={relations.none}
    overrides={overrides.none}
  />
)