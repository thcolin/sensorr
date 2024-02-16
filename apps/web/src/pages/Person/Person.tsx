import { useMemo } from 'react'
import { useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { utils } from '@sensorr/tmdb'
import { transformPersonDetails, Warning } from '@sensorr/ui'
import { compose } from '@sensorr/utils'
import { useTMDBRequest } from '../../store/tmdb'
import Details from '../Details/Details'
import { withPersonsMetadataContext } from '../../contexts/PersonsMetadata/PersonsMetadata'
import withProps from '../../components/enhancers/withProps'
import { useAnimationContext } from '../../contexts/Animation/Animation'
import { MovieWithCredits } from '../../components/Movie/Movie'

const PersonDetails = compose(
  withPersonsMetadataContext(),
  withProps({ behavior: 'person' }),
)(Details)

const Person = ({ ...props }) => {
  const { id } = useParams() as any
  const { t } = useTranslation()
  const { ongoing } = useAnimationContext() as any

  const { loading, error, data, details } = useTMDBRequest(`/person/${id}`, {
    append_to_response: 'images,tagged_images,movie_credits,translations',
    include_image_language: 'en,null',
  }, { transform: transformPersonDetails })

  const ready = !ongoing && !loading && (data?.id || error)

  const tabs = useMemo(() => {
    const known = {
      id: `known-${id}`,
      label: t('items.persons.known_for.label'),
      entities: data.known_for_department === 'Acting'
        ? utils.sortCredits(data?.movie_credits || { cast: [], crew: [] }, [], ['cast'])
          .filter(c => c.vote_count >= 500 && data.known_for_department === 'Acting' && c.order <= 4)
          .sort((a, b) => (b.vote_count / ((b.order + 1) / 5)) - (a.vote_count / ((a.order + 1) / 5)))
        : utils.sortCredits(data?.movie_credits || { cast: [], crew: [] }, [], ['crew'])
          .filter(c => c.vote_count >= 500 && c.department.includes(data.known_for_department))
          .sort((a, b) => b.vote_count - a.vote_count),
      child: MovieWithCredits,
      ready: ready,
      props: ({ index, entity }) => ({
        display: index < 5 ? 'pretty' : 'poster',
        credits: data ? [
          {
            entity: {
              cast_id: null,
              credit_id: entity.credit_id,
              department: entity.department,
              gender: data?.gender,
              override: entity.override,
              id: data?.id,
              job: entity.job,
              character: entity.character || null,
              order: entity.order || null,
              name: data?.name,
              profile_path: data?.profile_path,
            },
          },
        ] : [],
      }),
    }

    const cast = {
      id: `cast-${id}`,
      label: t('items.persons.cast.label'),
      entities: utils.sortCredits(data?.movie_credits || { cast: [] }, [], ['cast'])
        .sort((a, b) => new Date(b.release_date || 0).getTime() - new Date(a.release_date || 0).getTime()),
      child: MovieWithCredits,
      ready: ready,
      props: ({ index, entity }) => ({
        display: index < 5 ? 'pretty' : 'poster',
        credits: data ? [
          {
            entity: {
              cast_id: null,
              character: entity.character,
              credit_id: entity.credit_id,
              override: entity.override,
              gender: data?.gender,
              id: data?.id,
              name: data?.name,
              order: entity.order,
              profile_path: data?.profile_path,
            },
          },
        ] : [],
      }),
    }

    const crew = {
      id: `crew-${id}`,
      label: t('items.persons.crew.label'),
      entities: utils.sortCredits(data?.movie_credits || { crew: [] }, [], ['crew'])
        .sort((a, b) => new Date(b.release_date || 0).getTime() - new Date(a.release_date || 0).getTime()),
      child: MovieWithCredits,
      ready: ready,
      props: ({ index, entity }) => ({
        display: index < 5 ? 'pretty' : 'poster',
        credits: data ? [
          {
            entity: {
              credit_id: entity.credit_id,
              department: entity.department,
              gender: data?.gender,
              override: entity.override,
              id: data?.id,
              job: entity.job,
              name: data?.name,
              profile_path: data?.profile_path,
            },
          },
        ] : [],
      }),
    }

    if (data.known_for_department === 'Acting') {
      return [
        ...((!ready || known.entities?.length) ? [{ id: 'known', tabs: [known] }] : []),
        ...((!ready || cast.entities?.length) ? [{ id: 'cast', tabs: [cast] }] : []),
        ...((!ready || crew.entities?.length) ? [{ id: 'crew', tabs: [crew] }] : []),
      ]
    }

    return [
      ...((!ready || known.entities?.length) ? [{ id: 'known', tabs: [known] }] : []),
      ...((!ready || crew.entities?.length) ? [{ id: 'crew', tabs: [crew] }] : []),
      ...((!ready || cast.entities?.length) ? [{ id: 'cast', tabs: [cast] }] : []),
    ]
  }, [ready, id, data])

  if (error) {
    return (
      <Warning
        emoji='💢'
        title='Sorry, unable to display person...'
        subtitle={error.message}
      />
    )
  }

  return (
    <PersonDetails
      details={details}
      entity={data}
      tabs={tabs}
      loading={loading}
      ready={ready}
    />
  )
}

export default Person
