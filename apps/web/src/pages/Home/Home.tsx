import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useResponsiveValue } from '@theme-ui/match-media'
import { TrendingMovies, ArchivedMovies, TheatresMovies, UpcomingMovies, CalendarMovies, DiscoverMovies } from '../../components/Entities/Movies'
import Person from '../../components/Person/Person'
import { TrendingPersons } from '../../components/Entities/Persons'
import DiscoverMoviesSelectable from './Items/DiscoverMoviesSelectable'
import { MovieWithCredits } from '../../components/Movie/Movie'

const Home = ({ ...props }) => {
  const { t } = useTranslation()
  const allowPretty = useResponsiveValue([false, true], { defaultIndex: 1 })
  const pretty = useCallback(({ index }) => ({
    display: ((allowPretty && index < 5) ? 'pretty' : 'poster') as 'pretty' | 'poster',
  }), [allowPretty])

  return (
    <>
      <TrendingMovies
        id='trending_movies'
        label={t('items.movies.trending.label')}
        // title={t('items.movies.trending.title')}
        display='row'
        child={MovieWithCredits}
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
      <ArchivedMovies
        id='archived'
        label={t('items.movies.archived.label')}
        // title={t('items.movies.archived.title')}
        display='row'
        child={MovieWithCredits}
        limit={20}
        hide={true}
        more={{
          title: t('items.movies.archived.more'),
          to: '/movie/library',
          state: { controls: { state: ['archived'] } },
        }}
      />
      <CalendarMovies
        id='calendar'
        label={t('items.movies.calendar.label')}
        // title={t('items.movies.calendar.title')}
        display='row'
        child={MovieWithCredits}
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
      <DiscoverMovies
        id='discover'
        label={t('items.movies.discover.label')}
        // title={t('items.movies.discover.title')}
        display='row'
        child={MovieWithCredits}
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
      <TheatresMovies
        id='theatres'
        label={t('items.movies.theatres.label')}
        // title={t('items.movies.theatres.title')}
        display='row'
        child={MovieWithCredits}
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
        child={MovieWithCredits}
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
        child={MovieWithCredits}
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
    </>
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
    color: 'rangoon',
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
