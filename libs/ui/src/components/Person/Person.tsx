import { memo, useMemo } from 'react'
import { LinkProps } from 'react-router-dom'
import i18n from '@sensorr/i18n'
import { emojize } from '@sensorr/utils'
import { Person as PersonInterface, Crew as CrewInterface, Cast as CastInterface } from '@sensorr/tmdb'
import { Empty } from '../../atoms/Picture/Picture'
import { Focus } from '../../atoms/Focus/Focus'
import { Link } from '../../atoms/Link/Link'
import { Details } from '../../elements/Entity'
import { Avatar } from '../../elements/Entity/Avatar/Avatar'
import { Card } from '../../elements/Entity/Card/Card'
import { Poster, PosterProps } from '../../elements/Entity/Poster/Poster'
import { Pretty } from '../../elements/Entity/Pretty/Pretty'
import { PersonState } from './State/State'

export interface PersonProps extends Omit<
  PosterProps,
  'link' | 'state' | 'focus' | 'placeholder' | 'actions' | 'details' | 'overrides' | 'size' | 'relations' | 'onReady' | 'palette' | 'empty'
> {
  entity: PersonInterface | CastInterface | CrewInterface
  display?: 'poster' | 'card' | 'avatar' | 'pretty'
  link?: ((PersonInterface) => LinkProps)
  focus?: 'popularity'
  placeholder?: boolean
  state?: 'loading' | 'ignored' | 'followed'
  setState?: (state: string) => any
  ready?: boolean
  compact?: boolean
}

const UIPerson = ({
  entity: data,
  display = 'poster',
  placeholder,
  state,
  setState,
  ready = true,
  ...props
}: PersonProps) => {
  // data
  const entity = useMemo(() => data || { profile_path: false, id: null }, [data, placeholder]) as PersonInterface
  const details = useMemo(() => transformPersonDetails(entity), [entity])
  const link = useMemo(() => (props.link || ((entity) => !!entity?.id && { to: `/person/${entity.id}` }))(entity), [entity, props.link])

  // components
  const focus = useMemo(() => entity.id === null || !props.focus ? [] : [
    Focus,
    { entity, property: props.focus, compact: true, size: 'small' }
  ], [entity, props.focus]) as [React.FC, any]

  const badge = useMemo(() => entity.id === null ? [] : [
    PersonState,
    { value: state, onChange: setState, compact: true }
  ], [entity, state, setState]) as [React.FC, any]

  // stuff
  const overrides = useMemo(() => ({
    ready: typeof entity.id === 'number' && !placeholder && ready,
  }), [props.focus, placeholder, entity, ready])

  switch (display) {
    case 'avatar':
      return (
        <Avatar
          {...props}
          details={details}
          link={link}
          highlight={['followed'].includes(state)}
          overrides={overrides}
          empty={Empty.person}
        />
      )
    case 'card':
      return (
        <Card
          {...props}
          details={details}
          link={link}
          state={badge}
          overrides={overrides}
          empty={Empty.person}
        />
      )
    case 'pretty':
      return (
        <Pretty
          {...props}
          details={details}
          link={link}
          state={badge}
          focus={focus}
          overrides={overrides}
          empty={Empty.person}
        />
      )
    default:
      return (
        <Poster
          {...props}
          details={details}
          link={link}
          state={badge}
          focus={focus}
          overrides={overrides}
          empty={Empty.person}
        />
      )
  }
}

export const Person = memo(UIPerson)

export interface PersonDetails extends Details {
  meaningful: {
    known_for_department?: React.ReactNode,
    job?: React.ReactNode,
    character?: React.ReactNode,
    place_of_birth?: React.ReactNode,
    age?: React.ReactNode,
    birthday?: React.ReactNode,
    deathday?: React.ReactNode,
  },
}

export const transformPersonDetails = (entity: PersonInterface | CrewInterface | CastInterface): PersonDetails => ({
  id: entity.id,
  title: entity.name,
  year: null,
  caption: (entity as any).override || (entity as CrewInterface).job || (entity as CastInterface).character || (entity as PersonInterface).known_for_department || '',
  tagline: null,
  overview: (entity as PersonInterface).biography || ((entity as any)?.translations?.translations || []).find(translation => translation.iso_639_1 === 'en')?.data?.biography || '',
  poster: entity.profile_path,
  billboard: null,
  meaningful: {
    known_for_department: !!(entity as PersonInterface).known_for_department ? () => (
      <Link
        sx={{ whiteSpace: 'nowrap' }}
        to='/movie/discover'
        state={{
          controls: {
            [(entity as PersonInterface).known_for_department === 'Acting' ? 'with_cast' : 'with_crew']: {
              behavior: 'and',
              values: [{ value: entity.id, label: entity.name }],
            },
          },
        }}
      >
        {emojize('💼', (entity as PersonInterface).known_for_department)}
      </Link>
    ) : null,
    job: !!(entity as CrewInterface).job ? () => (
      <span sx={{ whiteSpace: 'nowrap' }}>
        {emojize('💼', (entity as CrewInterface).job)}
      </span>
    ) : null,
    character: !!(entity as CastInterface).character ? () => (
      <span sx={{ whiteSpace: 'nowrap' }}>
        {emojize('🎞️', (entity as CastInterface).character )}
      </span>
    ) : null,
    place_of_birth: !!(entity as PersonInterface).place_of_birth ? () => (
      <span sx={{ whiteSpace: 'nowrap' }}>
        {emojize('🏡', (entity as PersonInterface).place_of_birth)}
      </span>
    ) : null,
    age: !!(entity as PersonInterface).birthday ? () => (
      <span sx={{ whiteSpace: 'nowrap' }}>
        {emojize('📅', (((entity as PersonInterface).deathday ? new Date((entity as PersonInterface).deathday) : new Date()).getFullYear() - new Date((entity as PersonInterface).birthday).getFullYear()))} {i18n.t('yearsOld')}
      </span>
    ) : null,
    birthday: !!(entity as PersonInterface).birthday ? () => (
      <span sx={{ whiteSpace: 'nowrap' }}>
        {emojize('🎂', new Date((entity as PersonInterface).birthday).toLocaleDateString())}
      </span>
    ) : null,
    deathday: !!(entity as PersonInterface).deathday ? () => (
      <span sx={{ whiteSpace: 'nowrap' }}>
        {emojize('🥀', new Date((entity as PersonInterface).deathday).toLocaleDateString())}
      </span>
    ) : null,
  },
})
