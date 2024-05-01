import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { utils } from '@sensorr/tmdb'
import { transformMovieDetails, transformPersonDetails, Warning } from '@sensorr/ui'
import { compose, emojize } from '@sensorr/utils'
import { useTMDBRequest } from '../../store/tmdb'
import Details from '../Details/Details'
import { usePersonsMetadataContext, withPersonsMetadataContext } from '../../contexts/PersonsMetadata/PersonsMetadata'
import withProps from '../../components/enhancers/withProps'
import { useDeviceContext } from '../../contexts/Device/Device'
import { MovieWithCreditsAndReviews } from '../../components/Movie/Movie'
import { useScrollPositionContext } from '../../contexts/ScrollPosition/ScrollPosition'

const PersonDetails = compose(
  withPersonsMetadataContext(),
  withProps({ behavior: 'person' }),
)(Details)

const Person = ({ ...props }) => {
  const { restoreScrollPosition } = useScrollPositionContext()
  const { id } = useParams() as any
  const { t } = useTranslation()
  const { device } = useDeviceContext()
  const { metadata: { [id]: metadata } } = usePersonsMetadataContext() as any

  const { loading, error, data, details } = useTMDBRequest(`person/${id}`, {
    append_to_response: 'images,tagged_images,movie_credits,translations',
    include_image_language: 'en,null',
  }, { transform: transformPersonDetails })

  const cast = useTMDBRequest('discover/movie', {
    with_cast: id,
    with_release_type: '3|2|1',
    without_genres: '99|10770', // Documentary -- sorry
    'with_runtime.gte': 20,
    sort_by: 'primary_release_date.desc',
  }, { transform: transformMovieDetails })

  const ready = !loading && !!(data?.id || error)

  useEffect(() => {
    if (ready) {
      restoreScrollPosition()
    }
  }, [ready])

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
      child: MovieWithCreditsAndReviews,
      ready: ready,
      props: ({ index, entity }) => ({
        display: (index < 5 && device !== 'mobile') ? 'pretty' : 'poster',
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
            state: metadata?.state || 'ignored',
          },
        ] : [],
      }),
    }

    const relevantCast = {
      id: `cast-${id}`,
      label: t('items.persons.cast.label'),
      entities: cast?.data?.results || [],
      child: MovieWithCreditsAndReviews,
      ready: ready,
      props: ({ index }) => ({
        display: (index < 5 && device !== 'mobile') ? 'pretty' : 'poster',
      }),
      more: {
        to: `/movie/discover`,
        state: {
          controls: {
            with_release_type: {
              behavior: 'or',
              values: [
                { value: 1, label: 'Premiere' },
                { value: 2, label: 'Theatrical' },
                { value: 3, label: 'Digital' },
              ],
            },
            with_runtime: [20, 6000],
            sort_by: { sort: true, value: 'primary_release_date' },
            with_cast: {
              behavior: 'or',
              values: [{ value: id, label: details.title }],
            },
            without_genres: {
              behavior: 'or',
              values: [
                { value: 99, label: 'Docuemntary' },
                { value: 10770, label: 'TV Movie' },
              ],
            },
          },
        },
      },
    }

    const fullCast = {
      id: `fullcast-${id}`,
      label: !relevantCast.entities.length ? t('items.persons.cast.label') : t('items.persons.fullcast.label'),
      entities: utils.sortCredits(data?.movie_credits || { cast: [] }, [], ['cast'])
        .sort((a, b) => new Date(b.release_date || 0).getTime() - new Date(a.release_date || 0).getTime())
        .slice(0, 20),
      child: MovieWithCreditsAndReviews,
      ready: ready,
      props: ({ index, entity }) => ({
        display: (index < 5 && device !== 'mobile') ? 'pretty' : 'poster',
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
            state: metadata?.state || 'ignored',
          },
        ] : [],
      }),
      more: {
        to: `/movie/discover`,
        state: {
          controls: {
            sort_by: { sort: true, value: 'primary_release_date' },
            with_cast: {
              behavior: 'or',
              values: [{ value: id, label: details.title }],
            },
          },
        },
      },
    }

    const relevantCrew = {
      id: `crew-${id}`,
      label: data.known_for_department === 'Acting' ? t('items.persons.crew.label') : emojize('🎬', data.known_for_department),
      entities: utils.sortCredits(data?.movie_credits || { crew: [] }, [], ['crew'])
        .filter(c => !c.video && !c.genres.find(g => [99, 10770].includes(g.id)) && !(c.department.includes('Production') && c.department.length === 1) && c.job !== 'Thanks')
        .filter(c => (!data.known_for_department || data.known_for_department === 'Acting') || c.department.includes(data.known_for_department))
        .sort((a, b) => new Date(b.release_date || 0).getTime() - new Date(a.release_date || 0).getTime()),
      child: MovieWithCreditsAndReviews,
      ready: ready,
      props: ({ index, entity }) => ({
        display: (index < 5 && device !== 'mobile') ? 'pretty' : 'poster',
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
            state: metadata?.state || 'ignored',
          },
        ] : [],
      }),
      more: {
        to: `/movie/discover`,
        state: {
          controls: {
            with_release_type: {
              behavior: 'or',
              values: [
                { value: 1, label: 'Premiere' },
                { value: 2, label: 'Theatrical' },
                { value: 3, label: 'Digital' },
              ],
            },
            with_runtime: [20, 6000],
            sort_by: { sort: true, value: 'primary_release_date' },
            with_crew: {
              behavior: 'or',
              values: [{ value: id, label: details.title }],
            },
            without_genres: {
              behavior: 'or',
              values: [
                { value: 99, label: 'Docuemntary' },
                { value: 10770, label: 'TV Movie' },
              ],
            },
          },
        },
      },
    }

    const fullCrew = {
      id: `fullcrew-${id}`,
      label: !relevantCrew.entities.length ? t('items.persons.crew.label') : t('items.persons.fullcrew.label'),
      entities: utils.sortCredits(data?.movie_credits || { crew: [] }, [], ['crew'])
        .sort((a, b) => new Date(b.release_date || 0).getTime() - new Date(a.release_date || 0).getTime())
        .slice(0, 20),
      child: MovieWithCreditsAndReviews,
      ready: ready,
      props: ({ index, entity }) => ({
        display: (index < 5 && device !== 'mobile') ? 'pretty' : 'poster',
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
            state: metadata?.state || 'ignored',
          },
        ] : [],
      }),
      more: {
        to: `/movie/discover`,
        state: {
          controls: {
            sort_by: { sort: true, value: 'primary_release_date' },
            with_crew: {
              behavior: 'or',
              values: [{ value: id, label: details.title }],
            },
          },
        },
      },
    }

    if (data.known_for_department === 'Acting') {
      return [
        ...((!ready || known.entities?.length) ? [{ id: 'known', tabs: [known] }] : []),
        ...((!ready || fullCast.entities?.length) ? [{ id: 'cast', tabs: relevantCast.entities.length ? [relevantCast, fullCast] : [fullCast] }] : []),
        ...((!ready || fullCrew.entities?.length) ? [{ id: 'crew', tabs: relevantCrew.entities.length ? [relevantCrew, fullCrew] : [fullCrew] }] : []),
      ]
    }

    return [
      ...((!ready || known.entities?.length) ? [{ id: 'known', tabs: [known] }] : []),
      ...((!ready || fullCrew.entities?.length) ? [{ id: 'crew', tabs: relevantCrew.entities.length ? [relevantCrew, fullCrew] : [fullCrew] }] : []),
      ...((!ready || fullCast.entities?.length) ? [{ id: 'cast', tabs: relevantCast.entities.length ? [relevantCast, fullCast] : [fullCast] }] : []),
    ]
  }, [ready, id, data, metadata])

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
