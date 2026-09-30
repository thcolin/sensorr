import { createContext, memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { animate } from 'framer-motion'
import { Movie as MovieInterface, Collection as CollectionInterface, Person as PersonInterface, Cast as CastInterface, Crew as CrewInterface } from '@sensorr/tmdb'
import { Movie, MovieProps } from '../../components/Movie/Movie'
import { Person, PersonProps } from '../../components/Person/Person'
import { Show, ShowProps } from '../../components/Show/Show'
import { AbstractEntity, AbstractEntityProps } from '../../components/AbstractEntity/AbstractEntity'
import { Grid, GridProps } from '../../elements/Grid/Grid'
import { List, ListProps } from '../../elements/List/List'
import { Warning, WarningProps } from '../../atoms/Warning/Warning'
import { DragScroll } from '../../atoms/DragScroll/DragScroll'
import { NavLink } from 'react-router-dom'
import { Icon } from '@sensorr/ui'

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
  child: typeof Movie | typeof AbstractEntity | typeof Person | typeof Show
  props?: (props?: { index?: number, entity?: EntityInterface }) => Omit<MovieProps, 'entity'> | Omit<AbstractEntityProps, 'entity'> | Omit<PersonProps, 'entity'> | Omit<ShowProps, 'entity'>
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

  const row = useRef<HTMLDivElement>(null)
  const paging = useRef(null)
  const [edges, setEdges] = useState({ start: true, end: true })

  useEffect(() => {
    const element = row.current

    if (!element || display !== 'row') {
      return
    }

    const update = () => {
      const start = element.scrollLeft <= 1
      const end = element.scrollLeft + element.clientWidth >= element.scrollWidth - 1
      setEdges(edges => (edges.start === start && edges.end === end) ? edges : { start, end })
    }

    update()
    element.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)

    return () => {
      element.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [display, total, ready])

  // The first item cut at the far edge comes to the near one, on the route curve
  const page = (direction: 1 | -1) => {
    const element = row.current
    const padding = parseFloat(getComputedStyle(element).paddingLeft)
    const origin = element.getBoundingClientRect().left - element.scrollLeft
    const items = (Array.from(element.children) as HTMLElement[]).map((item) => {
      const box = item.getBoundingClientRect()
      return { start: box.left - origin, end: box.right - origin }
    })
    const view = { start: element.scrollLeft + padding, end: element.scrollLeft + element.clientWidth - padding }
    const cut = direction > 0 ? items.find(item => item.end > view.end + 1) : [...items].reverse().find(item => item.start < view.start - 1)
    const start = direction > 0 ? cut?.start : items.find(item => item.start >= (cut?.end ?? 0) - (view.end - view.start) - 1)?.start
    const to = Math.max(0, Math.min(typeof start === 'number' ? start - padding : direction * Infinity, element.scrollWidth - element.clientWidth))

    paging.current?.stop()

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      element.scrollLeft = to
      return
    }

    paging.current = animate(element.scrollLeft, to, { duration: 0.4, ease: [0.4, 0, 0.2, 1], onUpdate: (left) => { element.scrollLeft = left } })
    element.addEventListener('pointerdown', () => paging.current?.stop(), { once: true })
  }

  const override = useMemo(() => (!total || !!error) ? (
    <Warning
      emoji={error ? ((error as any).emoji || '💢') : empty?.emoji}
      title={error ? ((error as any).title || 'Sorry, unable to display entities...') : empty?.title}
      subtitle={error ? ((error as any).subtitle || error.message) : empty?.subtitle}
    />
  ) : null, [total, error, empty])

  return (!!total || !ready || !hide) && (
    <EntitiesContextProvider entities={entities}>
      <div sx={{ ...UIEntities.styles.element, ...UIEntities.styles[display] }}>
        {label && (
          <div sx={UIEntities.styles.head}>
            <DragScroll sx={UIEntities.styles.label}>
              {(typeof label === 'string' && more) ? (
                <NavLink to={more.to} state={more.state} viewTransition>
                  {label}
                  <Icon value='chevron' direction={false} />
                </NavLink>
              ) : label}
            </DragScroll>
            {display === 'row' && !(edges.start && edges.end) && (
              <div sx={UIEntities.styles.paging}>
                <button type='button' aria-label='Scroll left' disabled={edges.start} onClick={() => page(-1)}>
                  <Icon value='chevron' direction={false} />
                </button>
                <button type='button' aria-label='Scroll right' disabled={edges.end} onClick={() => page(1)}>
                  <Icon value='chevron' direction={false} />
                </button>
              </div>
            )}
          </div>
        )}
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
            scroller={row}
            onMore={ready && onMore}
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
  },
  row: {
    paddingTop: 4,
    paddingBottom: [12, 2],
  },
  column: {
    paddingY: 4,
  },
  wrap: {
    paddingY: 4,
  },
  grid: {
    paddingY: 4,
  },
  head: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: [12, 8],
    marginTop: [4, 12],
  },
  label: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    paddingX: 4,
    fontFamily: 'heading',
    fontWeight: 'strong',
    overflowX: 'auto',
    overflowY: 'hidden',
    '>a': {
      variant: 'link.reset',
      display: 'flex',
      alignItems: 'center',
      minHeight: '44px',
      '>svg': {
        display: ['block', 'none'],
        height: '1.5em',
        width: '1.5em',
        marginLeft: 6,
        paddingTop: 8,
        paddingRight: 9,
        paddingBottom: 9,
        paddingLeft: 9,
        backgroundColor: 'gray',
        borderRadius: '1.5em',
        transform: 'rotate(-90deg)',
      },
    },
  },
  // The round chevron of the title's link on a phone, as a pair; a finger scrolls the row there
  paging: {
    display: ['none', 'flex'],
    flexShrink: 0,
    gap: 9,
    paddingRight: 4,
    '>button': {
      variant: 'button.reset',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '1.5em',
      width: '1.5em',
      padding: 12,
      borderRadius: '1.5em',
      backgroundColor: 'gray',
      transition: 'background-color 200ms ease-in-out, opacity 400ms ease-in-out',
      // The hit area reaches 2.5em, the round stays 1.5em
      '::after': {
        content: '""',
        position: 'absolute',
        inset: '-0.5em',
      },
      ':hover:not(:disabled)': {
        backgroundColor: 'grayDark',
      },
      ':focus-visible': {
        outline: '2px solid',
        outlineColor: 'text',
        outlineOffset: '2px',
      },
      ':disabled': {
        opacity: 0.33,
      },
      '>svg': {
        height: '0.75em',
        width: '0.75em',
      },
      ':first-of-type>svg': {
        transform: 'rotate(90deg)',
      },
      ':last-of-type>svg': {
        transform: 'rotate(-90deg)',
      },
    },
  },
  subtitle: {
    paddingX: 4,
    fontSize: 'small',
  },
}

export const Entities = memo(UIEntities)
