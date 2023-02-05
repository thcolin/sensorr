import { createContext, memo, useCallback, useContext, useMemo } from 'react'
import { Movie as MovieInterface, Collection as CollectionInterface, Person as PersonInterface, Cast as CastInterface, Crew as CrewInterface } from '@sensorr/tmdb'
import { Movie, MovieProps } from '../../components/Movie/Movie'
import { Person, PersonProps } from '../../components/Person/Person'
import { AbstractEntity, AbstractEntityProps } from '../../components/AbstractEntity/AbstractEntity'
import { Grid, GridProps } from '../../elements/Grid/Grid'
import { List, ListProps } from '../../elements/List/List'
import { Warning, WarningProps } from '../../atoms/Warning/Warning'

const withEntity = (context) => (WrappedComponent) => {
  const withEntity = ({ index, placeholder = false, props, ready, ...rest }) => {
    const { findEntity } = useContext(context) as any
    const entity = findEntity(index)

    return (
      <WrappedComponent
        {...rest}
        {...((props && props({ index, entity })) || {})}
        entity={entity}
        placeholder={placeholder}
        ready={ready}
      />
    )
  }

  withEntity.displayName = `withEntity(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return withEntity
}

type EntityInterface = MovieInterface | CollectionInterface | PersonInterface | CastInterface | CrewInterface

interface CommonProps extends
  Omit<GridProps, 'length' |'child' |'override' |'onMore'>,
  Omit<ListProps, 'entities' | 'length' | 'child' | 'override' | 'display'>
{
  child: typeof Movie | typeof AbstractEntity | typeof Person
  props?: (props?: { index?: number, entity?: EntityInterface }) => Omit<MovieProps, 'entity'> | Omit<AbstractEntityProps, 'entity'> | Omit<PersonProps, 'entity'>
  length?: number
  entities?: EntityInterface[]
  onMore?: () => void
  setParams?: any
  display?: 'row' | 'column' | 'wrap' | 'grid'
  limit?: number
  placeholders?: number
  ready?: boolean
  error?: Error
  label?: React.ReactNode | string
  subtitle?: React.ReactNode
}

export type EntitiesProps = CommonProps & (
  {
    hide: true
    empty?: WarningProps
  } | {
    hide?: boolean
    empty: WarningProps
  }
)

const UIEntities = ({
  id,
  child: Child,
  props,
  length,
  entities,
  onMore,
  setParams,
  display = 'row',
  limit = Infinity,
  placeholders = 20,
  ready = true,
  hide = false,
  error = null,
  label,
  subtitle,
  empty,
  more,
  ...rest
}: EntitiesProps) => {
  const [EntitiesContext, EntitiesContextProvider] = useMemo(() => {
    const context = createContext(null)
    const Provider = ({ entities, ...props }) => {
      const findEntity = useCallback((index) => (entities || [])[index] || {} as any, [entities])

      return (
        <context.Provider {...props} value={{ findEntity }} />
      )
    }

    return [context, Provider]
  }, [])

  const WrappedChild = useMemo(() => withEntity(EntitiesContext)(Child), [Child, EntitiesContext]) as React.FC<any>

  const total = useMemo(() => Math.min((ready ?
    ((typeof length === 'number' ? length : entities?.length) || 0) :
    ((typeof placeholders === 'number' ? placeholders : entities?.length) || 20)
  ), limit), [limit, ready, length, placeholders, entities?.length])

  const override = useMemo(() => (!total || !!error) ? (
    <Warning
      emoji={error ? ((error as any).emoji || '💢') : empty?.emoji}
      title={error ? ((error as any).title || 'Sorry, unable to display entities...') : empty?.title}
      subtitle={error ? ((error as any).subtitle || error.message) : empty?.subtitle}
    />
  ) : null, [total, error, empty])

  return (!!total || !ready || !hide) && (
    <EntitiesContextProvider entities={entities}>
      <div sx={UIEntities.styles.element}>
        {label && <div sx={UIEntities.styles.label}>{label}</div>}
        {display === 'grid' ? (
          <Grid
            {...rest}
            length={total}
            child={WrappedChild}
            childProps={{ props, ready }}
            override={override}
            onMore={ready && onMore}
          />
        ) : (
          <List
            {...rest}
            id={id}
            length={total}
            child={WrappedChild}
            childProps={{ props, ready }}
            entities={entities}
            override={override}
            display={display}
            more={more}
          />
        )}
        {subtitle && <div sx={UIEntities.styles.subtitle}>{subtitle}</div>}
      </div>
    </EntitiesContextProvider>
  )
}

UIEntities.styles = {
  element: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    paddingY: 0,
  },
  label: {
    paddingX: 4,
    fontFamily: 'heading',
    fontWeight: 'strong',
    paddingBottom: 0,
  },
  subtitle: {
    paddingX: 4,
    fontSize: 'small',
  },
}

export const Entities = memo(UIEntities)
