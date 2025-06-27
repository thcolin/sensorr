import { useEffect, useState, useMemo } from 'react'
import { Entities, withControls, Option } from '@sensorr/ui'
import { compose, emojize, regions, scrollToTop, useHistoryState } from '@sensorr/utils'
import { useFieldsComputedStatistics as useStatistics } from '@sensorr/tmdb'
import i18n from '@sensorr/i18n'
import { useMoviesMetadataContext } from '../../contexts/MoviesMetadata/MoviesMetadata'
import { MovieWithCreditsAndReviews } from '../../components/Movie/Movie'
import { useTMDB } from '../../store/tmdb'
import withProps from '../../components/enhancers/withProps'
import withFetchQuery from '../../components/enhancers/withFetchQuery'
import withPlacehodersHistoryState from '../../components/enhancers/withPlacehodersHistoryState'

const EntitiesHideable = ({ controls, child: Child, ...props }) => {
  const HideableChild = useMemo(() => (props) => {
    const { loading, metadata: { [props.entity?.id]: metadata = null } } = useMoviesMetadataContext() as any

    return (
      <Child
        {...props}
        opacity={(!loading && controls.values.hide_library && metadata && metadata?.state !== 'ignored') ? 0.125 : 1}
      />
    )
  }, [controls.values.hide_library, Child])

  return (
    <Entities {...props as any} child={HideableChild} />
  )
}

export const Theatres = compose(
  withProps({
    id: 'theatres',
    display: 'grid',
    child: MovieWithCreditsAndReviews,
    empty: {
      emoji: '🍿',
      title: "Oh no, your request didn't return results",
      subtitle: (
        <span>
          Try something like, what are the <em>highest rated</em> <em>science fiction</em> movies that <em>Tom Cruise</em> has been in ?
        </span>
      ),
    },
    props: () => ({
      focus: 'release_date_full',
    }),
  }),
  withFetchQuery({}, 1, useTMDB, () => [
    ...useHistoryState('controls', { uri: '', params: {} }),
    ['hide_library']
  ] as any),
  withControls({
    title: i18n.t('pages.theatres.title'),
    useStatistics,
    hooks: {
      onChange: () => scrollToTop(),
    },
    layout: {
      nav: {
        display: 'grid',
        gridTemplateRows: 'auto',
        gap: '2em',
        gridTemplateColumns: ['1fr min-content min-content', '1fr min-content min-content min-content'],
        gridTemplateAreas: [
          `"results hide_library uri region"`,
          `"title results hide_library uri region"`,
        ],
        '>h4': {
          display: ['none', 'block'],
        },
      },
    },
    fields: {
      hide_library: {
        initial: false,
        hideFromFiltersCount: true,
        serialize: (key, raw) => ({ [key]: raw }),
        component: ({ value, onChange, ...props }) => (
          <div sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minWidth: '8em' }}>
            <Option
              id='hide_library'
              type='checkbox'
              checked={value}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.checked)}
            >
              Hide Library
            </Option>
          </div>
        ),
      },
      uri: {
        initial: 'movie/now_playing',
        serialize: (key, raw) => ({ [key]: raw }),
        component: ({ value = 'movie/now_playing', onChange, style, ...props }) => (
          <div
            sx={{
              ...style,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              marginY: 4,
              paddingX: 2,
              borderRadius: '0.25em',
              ':hover': {
                backgroundColor: 'accent',
              },
              '>label': {
                display: 'flex',
                alignItems: 'center',
                height: '100%',
                color: 'textShadow',
                fontSize: 4,
                fontWeight: 'semibold',
              },
              '>select': {
                variant: 'select.reset',
                position: 'absolute',
                height: '100%',
                width: '100%',
                right: '0px',
                opacity: 0,
                fontSize: 4,
                fontWeight: 'semibold',
              },
            }}
          >
            <label htmlFor='uri'>{i18n.t(`pages.theatres.controls.uri.options.${value.split('/').pop()}`)}</label>
            <select id='uri' value={value} onChange={e => onChange(e.target.value)}>
              <option value='movie/now_playing'>{i18n.t('pages.theatres.controls.uri.options.now_playing')}</option>
              <option value='movie/upcoming'>{i18n.t('pages.theatres.controls.uri.options.upcoming')}</option>
            </select>
          </div>
        ),
      },
      region: {
        initial: i18n.language.slice(-2),
        serialize: (key, raw) => ({ [key]: raw }),
        component: ({ value = i18n.language.slice(-2), onChange, style, ...props }) => {
          const [options, setOptions] = useState([])

          useEffect(() => {
            const cb = async () => {
              setOptions((await regions.all()).reduce((acc, region) => ({ ...acc, [region.country]: region }), {}))
            }

            cb()
          }, [])

          return (
            <div
              sx={{
                ...style,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                marginY: 4,
                paddingX: 2,
                borderRadius: '0.25em',
                ':hover': {
                  backgroundColor: 'accent',
                },
                '>label': {
                  display: 'flex',
                  alignItems: 'center',
                  height: '100%',
                  color: 'textShadow',
                  fontSize: 4,
                  fontWeight: 'semibold',
                },
                '>select': {
                  variant: 'select.reset',
                  position: 'absolute',
                  height: '100%',
                  width: '100%',
                  right: '0px',
                  opacity: 0,
                  fontSize: 4,
                  fontWeight: 'semibold',
                  '>option': {
                    width: '0px',
                  },
                },
              }}
            >
              <label htmlFor='region'>
                {options[value] && emojize(options[value].emoji, options[value].name)}
              </label>
              <select id='region' value={value} onChange={e => onChange(e.target.value)}>
                {Object.values(options).sort((a, b) => a.name.localeCompare(b.name)).map(region => (
                  <option key={region.country} value={region.country}>
                    {emojize(region.emoji, region.name)}
                  </option>
                ))}
              </select>
            </div>
          )
        },
      },
    },
  }),
  withPlacehodersHistoryState(),
)(EntitiesHideable)

export default Theatres
