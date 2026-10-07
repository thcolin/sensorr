import { useEffect, useState } from 'react'
import { withControls, ControlsSelect, Option } from '@sensorr/ui'
import { compose, emojize, regions, scrollToTop, useHistoryState } from '@sensorr/utils'
import { useFieldsComputedStatistics as useStatistics } from '@sensorr/tmdb'
import i18n from '@sensorr/i18n'
import { Trans } from 'react-i18next'
import { MovieWithCreditsAndReviews } from '../../components/Movie/Movie'
import { useTMDB } from '../../store/tmdb'
import withProps from '../../components/enhancers/withProps'
import withTitle from '../../components/enhancers/withTitle'
import withFetchQuery from '../../components/enhancers/withFetchQuery'
import withPlacehodersHistoryState from '../../components/enhancers/withPlacehodersHistoryState'
import { withBody } from '../../layout/withLayout'
import { EntitiesHideable } from '../../components/Entities/Hideable'
import withBulk from '../../components/enhancers/withBulk'

export const Theatres = compose(
  withTitle(i18n.t('pages.theatres.title')),
  withProps({
    id: 'theatres',
    display: 'grid',
    child: MovieWithCreditsAndReviews,
    bulk: 'movie',
    empty: {
      emoji: '🍿',
      title: <Trans i18nKey='entities.empty.title' />,
      subtitle: (
        <span>
          <Trans i18nKey='entities.movies.empty.subtitle' components={[<em />, <em />, <em />]} />
        </span>
      ),
    },
    props: () => ({
      focus: 'release_date_full',
    }),
  }),
  // The history holds the values of the fields, and the `uri` field starts empty if it holds `uri: ''`: TMDB is then asked nothing
  withFetchQuery({}, 1, useTMDB, () => useHistoryState('controls', {}) as any),
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
              <Trans i18nKey='pages.hideLibrary' />
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
        component: function RegionField({ value = i18n.language.slice(-2), onChange, style }) {
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
  withBulk(),
)(EntitiesHideable)

export default Theatres
