import { Meta } from '@storybook/react'
import { Movie as UIMovie } from './Movie'
import { fixtures } from '@sensorr/tmdb'

const credits = {
  none: null,
  loading: [
    { entity: { profile_path: false }, state: 'loading' },
    { entity: { profile_path: false }, state: 'loading' },
    { entity: { profile_path: false }, state: 'loading' },
    { entity: { profile_path: false }, state: 'loading' },
    { entity: { profile_path: false }, state: 'loading' },
    { entity: { profile_path: false }, state: 'loading' },
    { entity: { profile_path: false }, state: 'loading' },
    { entity: { profile_path: false }, state: 'loading' },
  ],
  full: [
    { entity: fixtures.crew, state: 'followed' },
    { entity: fixtures.cast, state: 'ignored' },
    { entity: fixtures.person, state: 'followed' },
    { entity: fixtures.crew, state: 'ignored' },
    { entity: fixtures.cast, state: 'followed' },
    { entity: fixtures.person, state: 'ignored' },
    { entity: fixtures.crew, state: 'followed' },
    { entity: fixtures.cast, state: 'ignored' },
  ],
}

export default { component: UIMovie, title: 'Components / Movie' } as Meta

export const Movie = (args: any) => <UIMovie {...args} />

Movie.args = {
  display: 'poster',
  entity: fixtures.movie,
  focus: null,
  state: 'wished',
  policy: 'french',
  policies: [
    {
      emoji: '🇫🇷',
      label: 'FRENCH',
      value: 'french',
    },
    {
      emoji: '🇬🇧',
      label: 'VOSTFR',
      value: 'vostfr',
    },
  ],
  placeholder: null,
  credits: null,
}

Movie.argTypes = {
  entity: {
    control: {
      type: null,
    },
  },
  policies: {
    control: {
      type: null,
    },
  },
  policy: {
    control: {
      type: 'select',
      options: {
        none: null,
        french: 'french',
      },
    },
  },
  credits: {
    control: {
      type: 'select',
      options: credits,
    },
  },
}

export const MoviePosterLoading = (args: any) => (
  <Movie
    {...args}
    placeholder={true}
  />
)

export const MoviePoster = (args: any) => (
  <Movie
    {...args}
    display='poster'
    entity={fixtures.movie}
    state='archived'
  />
)

export const MoviePosterWithFocus = (args: any) => (
  <Movie
    {...args}
    display='poster'
    entity={fixtures.movie}
    state='archived'
    focus='popularity'
  />
)

export const MoviePosterWithLoadingCredits = (args: any) => (
  <Movie
    {...args}
    display='poster'
    entity={fixtures.movie}
    state='archived'
    credits={credits.loading}
  />
)

export const MoviePosterWithCredits = (args: any) => (
  <Movie
    {...args}
    display='poster'
    entity={fixtures.movie}
    state='archived'
    credits={credits.full}
  />
)

export const MoviePrettyLoading = (args: any) => (
  <Movie
    {...args}
    display='pretty'
    placeholder={true}
  />
)

export const MoviePretty = (args: any) => (
  <Movie
    {...args}
    display={'pretty'}
    entity={fixtures.movie}
    state={'archived'}
  />
)

export const MoviePrettyWithLoadingCredits = (args: any) => (
  <Movie
    {...args}
    display='pretty'
    entity={fixtures.movie}
    state='archived'
    credits={credits.loading}
  />
)

export const MoviePrettyWithCredits = (args: any) => (
  <Movie
    {...args}
    display='pretty'
    entity={fixtures.movie}
    state='archived'
    credits={credits.full}
  />
)
