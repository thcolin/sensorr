import { Picture as UIPicture, Empty } from './Picture'
import { fixtures } from '@sensorr/tmdb'
import { fixtures as palettes } from '@sensorr/palette'

export default { component: UIPicture, title: 'Atoms / Picture' }

export const Picture = (args: any) => <UIPicture {...args} />

Picture.args = {
  path: fixtures.movie.poster_path,
  palette: palettes.green,
  size: 'w300',
  ready: true,
  empty: Empty.movie,
}

Picture.argTypes = {
  path: {
    control: {
      type: 'select',
      options: {
        Movie: fixtures.movie.poster_path,
        Person: fixtures.person.profile_path,
        Cast: fixtures.cast.profile_path,
        Crew: fixtures.crew.profile_path,
        empty: null,
      },
    },
  },
  palette: {
    control: {
      type: 'select',
      options: {
        none: null,
        Green: palettes.green,
        Blue: palettes.blue,
      },
    },
  },
  size: {
    table: {
      type: {
        summary: `"w45" | "w92" | "w154" | "w185" | "w300" | "w342" | "w500" | "w780" | "h632" | "original"`,
      },
    },
    control: {
      type: 'select',
      options: ['w45', 'w92', 'w154', 'w185', 'w300', 'w342', 'w500', 'w780', 'h632', 'original'],
    },
  },
  empty: {
    control: {
      type: 'select',
      options: Empty,
    },
  },
  onReady: {
    control: {
      type: null,
    },
  },
}

export const Loading = (args: any) => <UIPicture {...args} path={null} ready={false} />
export const EmptyMovie = (args: any) => <UIPicture {...args} path={null} empty={Empty.movie} />
export const EmptyPerson = (args: any) => <UIPicture {...args} path={null} empty={Empty.person} />
export const EmptyDefault = (args: any) => <UIPicture {...args} path={null} empty={Empty.default} />
export const MoviePoster = (args: any) => <UIPicture {...args} path={fixtures.movie.poster_path} />
export const MovieBackdrop = (args: any) => <UIPicture {...args} path={fixtures.movie.backdrop_path} />
export const PersonProfile = (args: any) => <UIPicture {...args} path={fixtures.person.profile_path} />
export const CrewProfile = (args: any) => <UIPicture {...args} path={fixtures.crew.profile_path} />
export const CastProfile = (args: any) => <UIPicture {...args} path={fixtures.cast.profile_path} />
