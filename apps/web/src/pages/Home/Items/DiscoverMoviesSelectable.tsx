import { useEffect, useState } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { Link } from '@sensorr/ui'
import { DiscoverMovies } from '../../../components/Entities/Movies'
import { useTMDB } from '../../../store/tmdb'

const DiscoverMoviesSelectable = ({ ...props }) => {
  const { t } = useTranslation()
  const tmdb = useTMDB()
  const random = {
    year: () => Math.min(Math.round(Math.random() * (new Date().getFullYear() - 1925) + 1925 + (Math.random() * 20)), new Date().getFullYear() - 2),
    genre: () => Object.values(tmdb.genres)[Math.floor(Math.random() * Object.keys(tmdb.genres).length)] || { id: -1, name: '' },
    studio: () => Object.values(tmdb.studios)[Math.floor(Math.random() * Object.keys(Object.keys(tmdb.studios)).length)] || { name: '', companies: [] },
  }

  const [rows, setRows] = useState({ random: 'year' })
  const [values, setValues] = useState({ year: random.year(), genre: random.genre(), studio: random.studio() })

  useEffect(() => {
    const interval = setInterval(() => {
      if (tmdb.ready) {
        clearInterval(interval)
        setValues(values => ({ ...values, genre: random.genre() }))
      }
    }, 100)

    return () => clearInterval(interval)
  }, [])

  return (
    <DiscoverMovies
      {...props}
      debounce={true}
      label={(
        <span>
          <Link
            to={null}
            sx={DiscoverMoviesSelectable.styles.label}
            {...(rows.random === 'year' ? {
              style: { opacity: 1, pointerEvents: 'none' },
            } : {
              title: t('items.movies.discoverSelectable.year.title'),
              onClick: () => setRows(rows => ({ ...rows, random: 'year' })),
            })}
          >
            <Trans
              i18nKey="items.movies.discoverSelectable.year.label"
              values={{ value: `(${values.year})` }}
              components={{ small: <span style={{ fontSize: 'smaller', fontWeight: 'normal' }} /> }}
            />
          </Link>
          {!!values.genre.name && (
            <Link
              to={null}
              sx={DiscoverMoviesSelectable.styles.label}
              {...(rows.random === 'genre' ? {
                style: { opacity: 1, pointerEvents: 'none' },
              } : {
                title: t('items.movies.discoverSelectable.genre.title'),
                onClick: () => setRows(rows => ({ ...rows, random: 'genre' })),
              })}
            >
              <Trans
                i18nKey="items.movies.discoverSelectable.genre.label"
                values={{ value: `(${values.genre.name})` }}
                components={{ small: <span style={{ fontSize: 'smaller', fontWeight: 'normal' }} /> }}
              />
            </Link>
          )}
          <Link
            to={null}
            sx={DiscoverMoviesSelectable.styles.label}
            {...(rows.random === 'studio' ? {
              style: { opacity: 1, pointerEvents: 'none' },
            } : {
              title: t('items.movies.discoverSelectable.studio.title'),
              onClick: () => setRows(rows => ({ ...rows, random: 'studio' })),
            })}
          >
            <Trans
              i18nKey="items.movies.discoverSelectable.studio.label"
              values={{ value: `(${values.studio.name})` }}
              components={{ small: <span style={{ fontSize: 'smaller', fontWeight: 'normal' }} /> }}
            />
          </Link>
        </span>
      )}
      more={{
        to: {
          year: {
            pathname: '/movie/discover',
            state: {
              controls: {
                primary_release_date: [new Date(`01-01-${values.year}`), new Date(`31-12-${values.year}`)],
                sorting: 'popularity',
                reverse: false,
              },
            },
          },
          genre: {
            pathname: '/movie/discover',
            state: {
              controls: {
                with_genres: {
                  behavior: 'or',
                  values: [{ value: values.genre.id, label: values.genre.name }],
                },
                sorting: 'popularity',
                reverse: false,
              },
            },
          },
          studio: {
            pathname: '/movie/discover',
            state: {
              controls: {
                with_companies: {
                  behavior: 'or',
                  values: values.studio.companies.map(studio => ({ value: studio.id, label: studio.name })),
                },
                sorting: 'popularity',
                reverse: false,
              },
            },
          },
        }[rows.random],
      }}
      query={({
        year: {
          params: {
            primary_release_year: values.year,
            sort_by: 'popularity.desc'
          },
        },
        genre: {
          params: {
            with_genres: values.genre.id,
            sort_by: 'popularity.desc'
          },
        },
        studio: {
          params: {
            with_companies: values.studio.companies.map(company => company.id).join('|'),
            sort_by: 'popularity.desc'
          },
        },
      }[rows.random])}
    />
  )
}

DiscoverMoviesSelectable.styles = {
  label: {
    variant: 'link.reset',
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

export default DiscoverMoviesSelectable
