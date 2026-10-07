import { useMemo } from 'react'
import { Entities, withControls } from '@sensorr/ui'
import { useParams } from 'react-router-dom'
import { compose, scrollToTop } from '@sensorr/utils'
import { useFieldsComputedStatistics as useStatistics } from '@sensorr/tmdb'
import i18n from '@sensorr/i18n'
import { Trans } from 'react-i18next'
import { MovieWithCreditsAndReviews } from '../../components/Movie/Movie'
import { useTMDB } from '../../store/tmdb'
import withProps from '../../components/enhancers/withProps'
import withTitle from '../../components/enhancers/withTitle'
import withFetchQuery, { useControlsHistoryState } from '../../components/enhancers/withFetchQuery'
import withPlacehodersHistoryState from '../../components/enhancers/withPlacehodersHistoryState'
import Body from '../../layout/Body/Body'
import withBulk from '../../components/enhancers/withBulk'

export const Similar = (id) => compose(
  withTitle('pages.similar.title'),
  withProps({
    id: 'similar',
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
    props: () => ({ focus: 'vote_average' }),
  }),
  withFetchQuery({ uri: `movie/${id}/similar` }, 1, useTMDB, useControlsHistoryState),
  withControls({
    title: i18n.t('pages.similar.title'),
    useStatistics,
    hooks: {
      onChange: () => scrollToTop(),
    },
    layout: {
      nav: {
        display: 'grid',
        gridTemplateRows: 'auto',
        gap: '2em',
        gridTemplateColumns: ['1fr', '1fr min-content'],
        gridTemplateAreas: [
          `"results"`,
          `"title results"`,
        ],
        '>h4': {
          display: ['none', 'block'],
        },
      },
    },
    fields: {},
  }),
  withPlacehodersHistoryState(),
  withBulk(),
)(Entities)

const SimilarWrapper = ({ ...props }) => {
  const { id } = useParams() as any
  const Component = useMemo(() => Similar(id), [id])

  return (
    <Body>
      <Component />
    </Body>
  )
}

export default SimilarWrapper
