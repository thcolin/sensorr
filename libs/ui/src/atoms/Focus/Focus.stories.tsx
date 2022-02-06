import { Meta } from '@storybook/react'
import { Focus as UIFocus } from './Focus'
import { fixtures } from '@sensorr/tmdb'

export default { component: UIFocus, title: 'Atoms / Focus' } as Meta

export const Focus = (args: any) => <UIFocus {...args} />

Focus.args = {
  entity: fixtures.movie,
  property: 'vote_average',
  size: 'normal',
}

Focus.argTypes = {
  entity: {
    control: {
      type: 'select',
      options: {
        Movie: fixtures.movie,
      },
    },
  },
}

export const MovieVoteAverage = () => <Focus entity={fixtures.movie} property='vote_average' />
export const MovieReleaseDate = () => <Focus entity={fixtures.movie} property='release_date' />
export const MovieReleaseDateFull = () => <Focus entity={fixtures.movie} property='release_date_full' />
export const MoviePopularity = () => <Focus entity={fixtures.movie} property='popularity' />
export const MovieRuntime = () => <Focus entity={fixtures.movie} property='runtime' />
export const MovieVoteCount = () => <Focus entity={fixtures.movie} property='vote_count' />
