import { Movie as UIMovie, transformMovieDetails } from './Movie'
import { Poster } from '../../elements/Entity/Poster/Poster'
import { MovieState } from './State/State'
import { ReviewsBadge } from './Badges/ReviewsBadge'
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

export default { component: UIMovie, title: 'Components / Movie' }

export const Movie = (args: any) => <UIMovie {...args} />

Movie.args = {
  display: 'poster',
  entity: fixtures.movie,
  focus: null,
  state: 'wished',
  placeholder: null,
  credits: null,
}

Movie.argTypes = {
  entity: {
    control: {
      type: null,
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

// The poster a phone shows once checked, raised on its aura, forced here whatever the screen's width
export const MoviePosterSelected = (args: any) => (
  <Poster
    {...args}
    details={transformMovieDetails(fixtures.movie)}
    link={{ to: '/movie/1' }}
    interactive={true}
    selected={true}
    selectedVisible={true}
    onSelectedChange={() => {}}
    onPress={() => {}}
    badges={{
      state: { component: MovieState, props: { value: 'archived', onChange: () => {}, compact: true } },
      reviews: { component: ReviewsBadge, props: { entity: fixtures.movie, display: 'poster' } },
    }}
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
