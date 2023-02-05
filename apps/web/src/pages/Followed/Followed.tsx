import { useEffect, useState } from 'react'
import {
  Entities,
  FilterKnownForDepartment,
  FilterGender,
  FilterBirthday,
  FilterPopularity,
  withControls,
  Warning,
  Sorting,
} from '@sensorr/ui'
import { compose, scrollToTop, useHistoryState } from '@sensorr/utils'
import { fields } from '@sensorr/tmdb'
import Person from '../../components/Person/Person'
import withProps from '../../components/enhancers/withProps'
import withFetchQuery from '../../components/enhancers/withFetchQuery'
import withHistoryState from '../../components/enhancers/withHistoryState'
import { useAPI, query as APIQuery } from '../../store/api'
import i18n from '../../store/i18n'

const FollowedPersons = compose(
  withProps({
    display: 'grid',
    child: Person,
    empty: {
      emoji: '🧑‍🎤️',
      title: "Oh no, your request didn't return results",
      subtitle: (
        <span>
          Try something like, what are the <em>highest rated</em> <em>science fiction</em> movies that <em>Tom Cruise</em> has been in ?
        </span>
      ),
    },
  }),
  withFetchQuery(APIQuery.persons.getPersons({}), 1, useAPI, () => useHistoryState('controls', { uri: '', params: {} }) as any),
  withControls({
    title: i18n.t('pages.followed.title'),
    hooks: {
      onChange: () => scrollToTop(),
    },
    layout: {
      nav: {
        display: 'grid',
        gridTemplateColumns: ['1fr min-content min-content', '1fr min-content min-content min-content'],
        gridTemplateRows: 'auto',
        gap: '3em',
        gridTemplateAreas: [
          `"results toggle sort_by"`,
          `"title results toggle sort_by"`,
        ],
        '>h4': {
          display: ['none', 'block'],
        },
      },
      aside: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gridTemplateRows: 'auto',
        gap: '2em',
        gridTemplateAreas: `
          "head"
          "known_for_department"
          "gender"
          "birthday"
          "popularity"
        `,
      },
    },
    fields: {
      head: {
        initial: null,
        component: ({ ...props }) => (
          <div sx={{ paddingBottom: 4, whiteSpace: 'normal !important', '>div': { padding: 12 } }}>
            <Warning
              emoji="🎭"
              title="Followed"
              subtitle={(
                <span>
                  Explore followed directors, actors, writers, music composer, procuders... with various filters like <strong>department</strong>, <strong>gender</strong>, <strong>birthday</strong>, etc...
                  <br/>
                  <br/>
                  <small><em>Follow favorite directors, actors, writers... by changing person <code sx={{ variant: 'code.reset', marginX: 6, fontStyle: 'normal' }}>🔕 state</code> from anywhere in Sensorr !</em></small>
                </span>
              )}
            />
          </div>
        ),
      },
      sort_by: {
        initial: {
          value: 'updated_at',
          sort: true,
        },
        serialize: (key, raw) => ({ [key]: `${raw.value}.${{ true: 'desc', false: 'asc' }[raw.sort]}` }),
        component: withProps({
          label: i18n.t('ui.sorting'),
          options: [
            { label: i18n.t('ui.sortings.updated_at'), value: 'updated_at' },
            { label: i18n.t('ui.sortings.popularity'), value: 'popularity' },
            { label: i18n.t('ui.sortings.birthday'), value: 'birthday' },
          ]
        })(Sorting)
      },
      birthday: {
        ...fields.birthday,
        component: FilterBirthday,
      },
      popularity: {
        ...fields.popularity,
        component: FilterPopularity,
      },
      gender: {
        ...fields.gender,
        initial: [],
        serialize: (key, raw) => raw?.length ? { [key]: raw.join('|') } : {},
        component: FilterGender,
      },
      known_for_department: {
        ...fields.known_for_department,
        initial: [],
        serialize: (key, raw) => raw?.length ? { [key]: raw.join('|') } : {},
        component: FilterKnownForDepartment,
      },
    },
    useStatistics: () => {
      const api = useAPI()
      const [statistics, setStatistics] = useState({})

      useEffect(() => {
        const cb = async () => {
          const { uri, params, init } = APIQuery.persons.getStatistics({})

          try {
            setStatistics(await api.fetch(uri, params, init))
          } catch (e) {
            console.warn(e)
            setStatistics({})
          }
        }

        cb()
      }, [])

      return statistics
    },
  }),
  withHistoryState(),
)(Entities)

const Followed = ({ ...props }) => {
  return (
    <FollowedPersons
      display="grid"
      child={Person}
      empty={{
        emoji: '',
        title: '',
        subtitle: '',
      }}
    />
  )
}

export default Followed
