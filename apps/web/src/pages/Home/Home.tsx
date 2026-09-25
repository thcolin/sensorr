import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useTitle } from '@sensorr/utils'
import { TrendingMovies, ArchivedMovies, TheatresMovies, UpcomingMovies, CalendarMovies, DiscoverMovies, LibraryMovies } from '../../components/Entities/Movies'
import { useDeviceContext } from '../../contexts/Device/Device'
import Body from '../../layout/Body/Body'
import Person from '../../components/Person/Person'
import { TrendingPersons } from '../../components/Entities/Persons'
import DiscoverMoviesSelectable from './Items/DiscoverMoviesSelectable'
import { MovieWithCreditsAndReviews } from '../../components/Movie/Movie'
import Show from '../../components/Show/Show'
import { TrendingShows, LibraryShows, AiringShows, DiscoverShows, RequestedMoviesAndShows, MovieOrShow } from './Items/Shows'

const Home = ({ ...props }) => {
  useTitle('Home')
  const { t } = useTranslation()
  const { device } = useDeviceContext()
  const pretty = useCallback(({ index }) => ({
    display: (((device !== 'mobile') && index < 5) ? 'pretty' : 'poster') as 'pretty' | 'poster',
  }), [device])

  return (
    <Body overlayScrollbars={true}>
      <TrendingMovies
        id='trending_movies'
        label={t('items.movies.trending.label')}
        // title={t('items.movies.trending.title')}
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
      <TrendingShows
        id='trending_shows'
        label={t('items.shows.trending.label')}
        display='row'
        child={Show}
        limit={20}
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
      {device === 'mobile' ? (
        <LibraryMovies
          id='library'
          label={t('items.movies.library.label')}
          // title={t('items.movies.archived.title')}
          display='row'
          child={MovieWithCreditsAndReviews}
          limit={20}
          hide={true}
          more={{
            title: t('items.movies.library.more'),
            to: '/movie/library',
            // state: { controls: { state: ['archived'] } },
          }}
        />
      ) : (
        <ArchivedMovies
          id='archived'
          label={t('items.movies.archived.label')}
          // title={t('items.movies.archived.title')}
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
      )}
      <LibraryShows
        id='library_shows'
        label={t('items.shows.library.label')}
        display='row'
        child={Show}
        limit={20}
        hide={true}
        more={{
          title: t('items.shows.library.more'),
          to: '/tv/library',
        }}
      />
      <CalendarMovies
        id='calendar'
        dateMax={new Date(new Date().setMonth(new Date().getMonth() + 2))}
        label={t('items.movies.calendar.label')}
        // title={t('items.movies.calendar.title')}
        display='row'
        child={MovieWithCreditsAndReviews}
        limit={20}
        hide={true}
        props={() => ({
          focus: 'release_date_full',
        })}
        more={{
          title: t('items.movies.calendar.more'),
          to: '/movie/calendar',
        }}
      />
      <AiringShows
        id='airing'
        label={t('items.shows.airing.label')}
        display='row'
        child={Show}
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
      <RequestedMoviesAndShows
        id='requests'
        label={t('items.movies.requests.label')}
        // title={t('items.movies.requests.title')}
        display='row'
        child={MovieOrShow}
        limit={20}
        hide={true}
        // props={() => ({
        //   focus: 'release_date_full',
        // })}
        more={{
          title: t('items.movies.requests.more'),
          to: '/movie/requests',
        }}
      />
      <DiscoverMovies
        id='discover'
        label={t('items.movies.discover.label')}
        // title={t('items.movies.discover.title')}
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
      <DiscoverShows
        id='discover_shows'
        label={t('items.shows.discover.label')}
        display='row'
        child={Show}
        limit={20}
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
      <TheatresMovies
        id='theatres'
        label={t('items.movies.theatres.label')}
        // title={t('items.movies.theatres.title')}
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
      <UpcomingMovies
        id='upcoming'
        label={t('items.movies.upcoming.label')}
        // title={t('items.movies.upcoming.title')}
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
      <DiscoverMoviesSelectable
        id='discover_selectable'
        display='row'
        child={MovieWithCreditsAndReviews}
        limit={20}
        props={pretty}
      />
      <TrendingPersons
        id='trending_persons'
        label={t('items.persons.trending.label')}
        // title={t('items.persons.trending.title')}
        display='row'
        child={Person}
        limit={20}
        props={() => ({
          display: 'poster',
        })}
        more={{
          title: t('items.movies.trending.more'),
          to: '/person/trending',
        }}
        empty={{
          emoji: '',
          title: '',
          subtitle: '',
        }}
      />
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
