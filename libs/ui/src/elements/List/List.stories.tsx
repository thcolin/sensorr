import { Warning } from '../../atoms/Warning/Warning'
import { Movie } from '../../components/Movie/Movie'
import { Person } from '../../components/Person/Person'
import { List as UIList } from './List'
import { fixtures } from '@sensorr/tmdb'

const child = {
  // TODO: Should implement placeholder test, but react-lazy-load-image-component doesn't seems to trigger scroll events or something
  'Movie Poster': ({ index, placeholder }) => <Movie entity={fixtures.movie} state="wished" />,
  'Movie Pretty': ({ index, placeholder }) => <Movie entity={fixtures.movie} display="pretty" state="wished" />,
  'Movie Card': ({ index, placeholder }) => <Movie entity={fixtures.movie} display="card" state="wished" />,
  'Movie Mix': ({ index, placeholder }) => <Movie entity={fixtures.movie} display={index < 5 ? 'pretty' : 'poster'} state="wished" />,
  'Person Poster': ({ index, placeholder }) => <Person entity={fixtures.person} state="ignored" />,
  'Person Avatar': ({ index, placeholder }) => <Person entity={fixtures.person} display="avatar" state="ignored" />,
  'Person Card': ({ index, placeholder }) => <Person entity={fixtures.person} display="card" state="ignored" />,
}

const override = {
  none: null,
  error: <Warning emoji='🐛' title='Oh ! You came across a bug...' subtitle='Error: [API] "http://localhost:4200/api/movies?page=1": 404 (Not Found)' />,
}

export default { component: UIList, title: 'Elements / List' }

export const List = (args: any) => <UIList {...args} />

List.args = {
  id: 'list',
  length: 20,
  child: child['Movie Poster'],
  display: 'row',
}

List.argTypes = {
  child: {
    control: {
      type: 'select',
      options: child,
    },
  },
  entities: {
    control: {
      type: null,
    },
  },
  override: {
    control: {
      type: 'select',
      options: override,
    },
  },
  more: {
    control: {
      type: 'select',
      options: {
        none: null,
        trending: {
          title: 'More trending movies',
          to: '/movie/trending',
        },
      },
    },
  },
}

export const ListRowError = (args: any) => <List {...args} id='list-row-error' length={10} child={child['Movie Poster']} display='row' override={override.error} />
export const ListColumnError = (args: any) => <List {...args} id='list-column-error' length={10} child={child['Movie Poster']} display='column' override={override.error} />
export const ListRowMoviePoster = (args: any) => <List {...args} id='list-row-movie-poster' length={10} child={child['Movie Poster']} display='row' />
export const ListRowMovieMix = (args: any) => <List {...args} id='list-row-movie-mix' length={10} child={child['Movie Mix']} display='row' />
export const ListColumnMovieCard = (args: any) => <List {...args} id='list-column-movie-card' length={10} child={child['Movie Card']} display='column' />
export const ListRowPersonPoster = (args: any) => <List {...args} id='list-row-person-poster' length={10} child={child['Person Poster']} display='row' more={{ to: '/discover' }} />
export const ListColumnPersonCard = (args: any) => <List {...args} id='list-column-person-card' length={10} child={child['Person Card']} display='column' more={{ to: '/discover' }} />
export const ListRowPersonAvatar = (args: any) => <List {...args} id='list-row-person-avatar' length={4} child={child['Person Avatar']} display='row' compact={true} />
