import { useMemo, useEffect } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { compose, useHistoryState } from '@sensorr/utils'
import { Entities } from '@sensorr/ui'
import { useTMDB } from '../../../store/tmdb'
import { withTabsBehavior } from '../../../components/Entities/Tabs'
import withFetchQuery from 'apps/web/src/components/enhancers/withFetchQuery'

const Tabs = compose(
  withTabsBehavior(),
  withFetchQuery({}, 0, useTMDB),
)(Entities)

const DiscoverMoviesSelectable = ({ ...props }) => {
  const { t } = useTranslation()
  const tmdb = useTMDB()
  const [values, setValues] = useHistoryState('discover_selectable-values', null)
  const tabs = useMemo(() => ({
    year: {
      id: 'discover_selectable_year',
      ready: values !== null,
      label: (
        <Trans
          i18nKey="items.movies.discoverSelectable.year.label"
          values={{ value: `(${values?.year || 'loading'})` }}
          components={{ small: <span style={{ fontSize: 'smaller', fontWeight: 'normal' }} /> }}
        />
      ),
      query: {
        uri: 'discover/movie',
        params: {
          primary_release_year: values?.year,
          sort_by: 'popularity.desc'
        },
      },
      more: {
        to: '/movie/discover',
        state: {
          controls: {
            primary_release_date: [new Date(`01-01-${values?.year}`), new Date(`12-31-${values?.year}`)],
            sorting: 'popularity',
            reverse: false,
          },
        },
      },
    },
    genre: {
      id: 'discover_selectable_genre',
      ready: values !== null,
      label: (
        <Trans
          i18nKey="items.movies.discoverSelectable.genre.label"
          values={{ value: `(${values?.genre?.name || 'loading'})` }}
          components={{ small: <span style={{ fontSize: 'smaller', fontWeight: 'normal' }} /> }}
        />
      ),
      query: {
        uri: 'discover/movie',
        params: {
          with_genres: values?.genre?.id,
          sort_by: 'popularity.desc'
        },
      },
      more: {
        to: '/movie/discover',
        state: {
          controls: {
            with_genres: {
              behavior: 'or',
              values: [{ value: values?.genre?.id, label: values?.genre?.name }],
            },
            sorting: 'popularity',
            reverse: false,
          },
        },
      },
    },
    studio: {
      id: 'discover_selectable_studio',
      ready: values !== null,
      label: (
        <Trans
          i18nKey="items.movies.discoverSelectable.studio.label"
          values={{ value: `(${values?.studio?.name || 'loading'})` }}
          components={{ small: <span style={{ fontSize: 'smaller', fontWeight: 'normal' }} /> }}
        />
      ),
      query: {
        uri: 'discover/movie',
        params: {
          with_companies: values?.studio?.companies?.map(company => company.id).join('|'),
          sort_by: 'popularity.desc'
        },
      },
      more: {
        to: '/movie/discover',
        state: {
          controls: {
            with_companies: {
              behavior: 'or',
              values: values?.studio?.companies?.map(studio => ({ value: studio.id, label: studio?.name })),
            },
            sorting: 'popularity',
            reverse: false,
          },
        },
      },
    },
  }), [values])

  useEffect(() => {
    if (values !== null) {
      return
    }

    const interval = setInterval(() => {
      if (tmdb.ready) {
        clearInterval(interval)
        setValues({
          year: Math.min(Math.round(Math.random() * (new Date().getFullYear() - 1925) + 1925 + (Math.random() * 20)), new Date().getFullYear() - 2),
          genre: Object.values(tmdb.genres)[Math.floor(Math.random() * Object.keys(tmdb.genres).length)] || { id: -1, name: '' },
          studio: Object.values(tmdb.studios)[Math.floor(Math.random() * Object.keys(Object.keys(tmdb.studios)).length)] || { name: '', companies: [] },
        })
      }
    }, 100)

    return () => clearInterval(interval)
  }, [])

  return (
    <Tabs {...props} tabs={tabs} />
  )
}

export default DiscoverMoviesSelectable
