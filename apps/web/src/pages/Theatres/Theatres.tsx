import { useEffect, useState } from 'react'
import { withControls, ControlsSelect, Option } from '@sensorr/ui'
import { compose, emojize, regions, scrollToTop, useHistoryState } from '@sensorr/utils'
import { useFieldsComputedStatistics as useStatistics } from '@sensorr/tmdb'
import i18n from '@sensorr/i18n'
import { MovieWithCreditsAndReviews } from '../../components/Movie/Movie'
import { useTMDB } from '../../store/tmdb'
import withProps from '../../components/enhancers/withProps'
import withTitle from '../../components/enhancers/withTitle'
import withFetchQuery from '../../components/enhancers/withFetchQuery'
import withPlacehodersHistoryState from '../../components/enhancers/withPlacehodersHistoryState'
import { withBody } from '../../layout/withLayout'
import { EntitiesHideable } from '../../components/Entities/Hideable'

export const Theatres = compose(
  withTitle(i18n.t('pages.theatres.title')),
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
  withFetchQuery({}, 1, useTMDB, () => useHistoryState('controls', { uri: '', params: {} }) as any),
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
        serialize: () => ({}),
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
        component: ({ value = 'movie/now_playing', onChange, style }) => (
          <ControlsSelect
            id='uri'
            value={value}
            onChange={onChange}
            style={style}
            options={['movie/now_playing', 'movie/upcoming'].map(uri => ({ value: uri, label: i18n.t(`pages.theatres.controls.uri.options.${uri.split('/').pop()}`) }))}
          />
        ),
      },
      region: {
        initial: i18n.language.slice(-2),
        serialize: (key, raw) => ({ [key]: raw }),
        component: ({ value = i18n.language.slice(-2), onChange, style }) => {
          const [options, setOptions] = useState([])

          useEffect(() => {
            regions.all().then(regions => setOptions([...new Map(regions.map(region => [region.country, region])).values()]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(region => ({ value: region.country, label: emojize(region.emoji, region.name) }))
            ))
          }, [])

          return (
            <ControlsSelect id='region' value={value} onChange={onChange} style={style} options={options} />
          )
        },
      },
    },
  }),
  withPlacehodersHistoryState(),
  withBody(),
)(EntitiesHideable)

export default Theatres
