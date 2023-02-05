import { useMemo } from 'react'
import { Entities, withControls } from '@sensorr/ui'
import { useParams } from 'react-router-dom'
import { compose, scrollToTop, useHistoryState } from '@sensorr/utils'
import { useFieldsComputedStatistics as useStatistics } from '@sensorr/tmdb'
import i18n from '@sensorr/i18n'
import { MovieWithCredits } from '../../components/Movie/Movie'
import { useTMDB } from '../../store/tmdb'
import withProps from '../../components/enhancers/withProps'
import withFetchQuery from '../../components/enhancers/withFetchQuery'
import withHistoryState from '../../components/enhancers/withHistoryState'

export const Similar = (id) => compose(
  withProps({
    id: 'similar',
    display: 'grid',
    child: MovieWithCredits,
    empty: {
      emoji: '🍿',
      title: "Oh no, your request didn't return results",
      subtitle: (
        <span>
          Try something like, what are the <em>highest rated</em> <em>science fiction</em> movies that <em>Tom Cruise</em> has been in ?
        </span>
      ),
    },
    props: () => ({ focus: 'vote_average' }),
  }),
  withFetchQuery({ uri: `movie/${id}/similar` }, 1, useTMDB, () => useHistoryState('controls', { uri: '', params: {} }) as any),
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
  withHistoryState(),
)(Entities)

const SimilarWrapper = ({ ...props }) => {
  const { id } = useParams() as any
  const Component = useMemo(() => Similar(id), [id])
  return <Component />
}

export default SimilarWrapper
