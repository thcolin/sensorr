import { useCallback } from 'react'
import { useNavigationType } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { usePainted, useTitle } from '@sensorr/utils'
import { TrendingMovies, ArchivedMovies, TheatresMovies, UpcomingMovies, CalendarMovies, DiscoverMovies, LibraryMovies, SwapsMovies } from '../../components/Entities/Movies'
import { useDeviceContext } from '../../contexts/Device/Device'
import Body from '../../layout/Body/Body'
import Person from '../../components/Person/Person'
import { TrendingPersons, FollowedPersons, BirthdayPersons } from '../../components/Entities/Persons'
import DiscoverMoviesSelectable from './Items/DiscoverMoviesSelectable'
import { MovieWithCreditsAndReviews } from '../../components/Movie/Movie'
import Show, { FOOTER_HEIGHT } from '../../components/Show/Show'
import { TrendingShows, LibraryShows, AiringShows, DiscoverShows, RequestedMoviesAndShows, RequestedMovies, RequestedShows, MovieOrShow } from './Items/Shows'
import { ListRow } from './Items/List'
import { rowsOf, listRowId, List } from './rows'
import { useConfigContext } from '../../contexts/Config/Config'

const TITLES = { all: 'Home', movie: 'Movies', tv: 'TV', person: 'Stars' }

// The Stars Home stays as it was, the others draw the rows of `config.home`
const PERSON = ['followed_persons', 'birthday_persons', 'calendar', 'trending_persons']

// `all` is the home of the browser, the other sections the home of a bottom bar tab in the PWA
const Home = ({ section = 'all', ...props }: { section?: 'all' | 'movie' | 'tv' | 'person' }) => {
  useTitle(TITLES[section])
  const { t } = useTranslation()
  const { device } = useDeviceContext()
  const { config } = useConfigContext()
  const navigationType = useNavigationType()
  // Going back restores a scroll position that may need every row, so they all mount at once
  const painted = usePainted() || navigationType === 'POP'
  const pretty = useCallback(({ index }) => ({
    display: (((device !== 'mobile') && index < 5) ? 'pretty' : 'poster') as 'pretty' | 'poster',
  }), [device])

  const builtins = {
    trending_movies: (
      <TrendingMovies
        key='trending_movies'
        id='trending_movies'
        label={t('items.movies.trending.label')}
        display='row'
        child={MovieWithCreditsAndReviews}
        limit={20}
        props={pretty}
        more={{
          title: t('items.movies.trending.more'),
          to: '/movie/trending',
        }}
        empty={{
          emoji: '',
          title: '',
          subtitle: '',
        }}
      />
    ),
    trending_shows: (
      <TrendingShows
        key='trending_shows'
        id='trending_shows'
        label={t('items.shows.trending.label')}
        display='row'
        child={Show}
        extra={FOOTER_HEIGHT}
        limit={20}
        props={pretty}
        more={{
          title: t('items.shows.trending.more'),
          to: '/tv/trending',
        }}
        empty={{
          emoji: '',
          title: '',
          subtitle: '',
        }}
      />
    ),
    library: (device === 'mobile' || section === 'movie') ? (
      <LibraryMovies
        key='library'
        id='library'
        label={t('items.movies.library.label')}
        display='row'
        child={MovieWithCreditsAndReviews}
        limit={20}
        hide={true}
        more={{
          title: t('items.movies.library.more'),
          to: '/movie/library',
        }}
      />
    ) : (
      <ArchivedMovies
        key='archived'
        id='archived'
        label={t('items.movies.archived.label')}
        display='row'
        child={MovieWithCreditsAndReviews}
        limit={20}
        hide={true}
        more={{
          title: t('items.movies.archived.more'),
          to: '/movie/library',
          state: { controls: { state: ['archived'] } },
        }}
      />
    ),
    library_shows: (
      <LibraryShows
        key='library_shows'
        id='library_shows'
        label={t('items.shows.library.label')}
        display='row'
        child={Show}
        extra={FOOTER_HEIGHT}
        limit={20}
        hide={true}
        more={{
          title: t('items.shows.library.more'),
          to: '/tv/library',
        }}
      />
    ),
    followed_persons: (
      <FollowedPersons
        key='followed_persons'
        id='followed_persons'
        label={t('items.persons.followed.label')}
        display='row'
        child={Person}
        limit={20}
        hide={true}
        props={() => ({
          display: 'poster',
        })}
        more={{
          title: t('items.persons.followed.more'),
          to: '/person/followed',
        }}
      />
    ),
    birthday_persons: (
      <BirthdayPersons
        key='birthday_persons'
        id='birthday_persons'
        label={t('items.persons.birthdays.label')}
        display='row'
        child={Person}
        limit={20}
        hide={true}
        props={() => ({
          display: 'poster',
          focus: 'birthday',
        })}
      />
    ),
    calendar: (
      <CalendarMovies
        key='calendar'
        id='calendar'
        dateMax={new Date(new Date().setMonth(new Date().getMonth() + 2))}
        label={t('items.movies.calendar.label')}
        display='row'
        child={MovieWithCreditsAndReviews}
        limit={20}
        hide={true}
        props={() => ({
          focus: 'release_date_full',
        })}
        more={{
          title: t('items.movies.calendar.more'),
          to: section === 'person' ? '/person/calendar' : '/movie/calendar',
        }}
      />
    ),
    swaps: (
      <SwapsMovies
        key='swaps'
        id='swaps'
        label={t('items.movies.swaps.label')}
        display='row'
        child={MovieWithCreditsAndReviews}
        limit={20}
        hide={true}
        more={{
          title: t('items.movies.swaps.more'),
          to: '/movie/swaps',
        }}
      />
    ),
    airing: (
      <AiringShows
        key='airing'
        id='airing'
        label={t('items.shows.airing.label')}
        display='row'
        child={Show}
        extra={FOOTER_HEIGHT}
        limit={20}
        hide={true}
        props={() => ({
          focus: 'release_date_full',
        })}
        more={{
          title: t('items.shows.airing.more'),
          to: '/tv/calendar',
        }}
      />
    ),
    requests: (
      <RequestedMoviesAndShows
        key='requests'
        id='requests'
        label={t('items.movies.requests.label')}
        display='row'
        child={MovieOrShow}
        limit={20}
        hide={true}
        more={{
          title: t('items.movies.requests.more'),
          to: '/movie/requests',
        }}
      />
    ),
    requested_movies: (
      <RequestedMovies
        key='requested_movies'
        id='requested_movies'
        label={t('items.movies.requested.label')}
        display='row'
        child={MovieWithCreditsAndReviews}
        limit={20}
        hide={true}
        more={{
          title: t('items.movies.requested.more'),
          to: '/movie/requests',
        }}
      />
    ),
    requested_shows: (
      <RequestedShows
        key='requested_shows'
        id='requested_shows'
        label={t('items.shows.requested.label')}
        display='row'
        child={Show}
        extra={FOOTER_HEIGHT}
        limit={20}
        hide={true}
        more={{
          title: t('items.shows.requested.more'),
          to: '/tv/requests',
        }}
      />
    ),
    discover: (
      <DiscoverMovies
        key='discover'
        id='discover'
        label={t('items.movies.discover.label')}
        display='row'
        child={MovieWithCreditsAndReviews}
        limit={20}
        props={pretty}
        more={{
          title: t('items.movies.discover.more'),
          to: '/movie/discover',
        }}
        empty={{
          emoji: '',
          title: '',
          subtitle: '',
        }}
      />
    ),
    discover_shows: (
      <DiscoverShows
        key='discover_shows'
        id='discover_shows'
        label={t('items.shows.discover.label')}
        display='row'
        child={Show}
        extra={FOOTER_HEIGHT}
        limit={20}
        props={pretty}
        more={{
          title: t('items.shows.discover.more'),
          to: '/tv/discover',
        }}
        empty={{
          emoji: '',
          title: '',
          subtitle: '',
        }}
      />
    ),
    theatres: (
      <TheatresMovies
        key='theatres'
        id='theatres'
        label={t('items.movies.theatres.label')}
        display='row'
        child={MovieWithCreditsAndReviews}
        limit={20}
        hide={true}
        props={() => ({
          focus: 'release_date_full',
        })}
        more={{
          title: t('items.movies.theatres.more'),
          to: '/movie/theatres',
          state: { controls: { uri: 'movie/now_playing' } },
        }}
      />
    ),
    upcoming: (
      <UpcomingMovies
        key='upcoming'
        id='upcoming'
        label={t('items.movies.upcoming.label')}
        display='row'
        child={MovieWithCreditsAndReviews}
        limit={20}
        hide={true}
        props={() => ({
          focus: 'release_date_full',
        })}
        more={{
          title: t('items.movies.upcoming.more'),
          to: '/movie/theatres',
          state: { controls: { uri: 'movie/upcoming' } },
        }}
      />
    ),
    discover_selectable: (
      <DiscoverMoviesSelectable
        key='discover_selectable'
        id='discover_selectable'
        display='row'
        child={MovieWithCreditsAndReviews}
        limit={20}
        props={pretty}
      />
    ),
    trending_persons: (
      <TrendingPersons
        key='trending_persons'
        id='trending_persons'
        label={t('items.persons.trending.label')}
        display='row'
        child={Person}
        limit={20}
        props={() => ({
          display: 'poster',
        })}
        more={{
          title: t('items.persons.trending.more'),
          to: '/person/trending',
        }}
        empty={{
          emoji: '',
          title: '',
          subtitle: '',
        }}
      />
    ),
  }

  const lists: List[] = config.get('lists')
  const rows = section === 'person'
    ? PERSON.map((id) => builtins[id])
    : rowsOf(section, config.get(`home.${section}`), lists)
      .filter(({ hidden }) => !hidden)
      .map(({ id }) => id.startsWith('list:') ? <ListRow key={id} list={lists.find((list) => listRowId(list) === id)} props={pretty} /> : builtins[id])

  return (
    <Body overlayScrollbars={true}>
      {painted ? rows : rows.slice(0, 3)}
    </Body>
  )
}

Home.styles = {
  label: {
    variant: 'link.reset',
    fontWeight: 'bold',
    opacity: 0.6,
    margin: '0 2em 0 0',
  },
  subtitle: {
    textAlign: 'right',
    color: 'text',
    paddingX: 4,
    fontSize: 7,
    opacity: 0.5,
    '>button': {
      variant: 'button.reset',
    },
    '>label': {
      position: 'relative',
      '>select': {
        position: 'absolute',
        opacity: 0,
        top: '0px',
        left: '0px',
        height: '100%',
        width: '100%',
        appearance: 'none',
        border: 'none',
        cursor: 'pointer',
      },
    },
  },
}

export default Home
