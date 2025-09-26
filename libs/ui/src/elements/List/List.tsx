import { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import { Cast, Collection, Crew, Movie, Person } from '@sensorr/tmdb'
import { useHistoryState, useResponsiveValue } from '@sensorr/utils'
import nanobounce from 'nanobounce'
import ResponsiveVirtualGrid from 'react-responsive-virtual-grid'
import { Badge, BadgeProps } from '../../atoms/Badge/Badge'
import { Icon } from '../../atoms/Icon/Icon'
import { Link, LinkProps } from '../../atoms/Link/Link'

const withGridItemContainer = () => (WrappedComponent) => {
  const withGridItemContainer = ({ style, index, readyInViewport, scrolling, more, moreIndex, total, ...props }) => (
    <div sx={{ display: 'flex', justifyContent: 'center', ...style, ':focus-within': { zIndex: 1 } }}>
      {moreIndex === index ? (
        <div sx={UIList.styles.row.more}>
          <More {...more} />
        </div>
      ) : (
        <WrappedComponent {...props} index={index} />
      )}
    </div>
  )

  withGridItemContainer.displayName = `withGridItemContainer(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return withGridItemContainer
}

export interface ListProps {
  id: string
  length: number
  child: React.FC<any>
  childProps?: any
  entities?: (Movie | Collection | Person | Cast | Crew)[]
  override?: React.ReactNode
  display?: 'row' | 'column' | 'wrap'
  stack?: boolean
  compact?: boolean
  virtual?: boolean
  more?: Omit<MoreProps, 'rotate'>
  onMore?: () => void
  space?: number
}

const UIList = ({
  id,
  length,
  child: Child,
  childProps = {},
  override,
  entities = null,
  display = 'row',
  stack = false,
  compact = false,
  virtual = true,
  more = null,
  onMore = null,
  space = 4,
}: ListProps) => {
  const mobile = useResponsiveValue([true, false])
  const ref = useRef<HTMLDivElement>()
  const debounce = useMemo(() => nanobounce(100), [])
  const [scroll, setScroll] = useHistoryState(`${id}-scroll`, [0, 0], { enabled: !stack })

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!stack) {
      debounce(() => setScroll([ref.current?.scrollLeft || 0, ref.current?.scrollTop || 0]))
    }
  }, [id])

  const WrappedChild = useMemo(() => withGridItemContainer()(Child), [Child])

  useEffect(() => {
    if (!stack) {
      ref.current.scroll(...(scroll || [0, 0]))
    }
  }, [id])

  const styles = useMemo(() => ({
    ...UIList.styles[display],
    container: {
      ...UIList.styles[display].container,
      ...(compact ? { paddingY: 12 } : {}),
      ...((mobile && virtual && display === 'row') ? { display: 'block' } : {}),
    },
    entity: {
      ...UIList.styles[display].entity,
      ...(compact ? {
        padding: '0em',
        ':not(:last-of-type)': {
          marginRight: `${-space}em`,
        },
      } : {}),
    },
  }), [display, compact, space, mobile, virtual])

  return (
    <div ref={ref} sx={styles.container} onScroll={handleScroll}>
      {override || (
        (mobile && virtual && display === 'row') ? (
          <ResponsiveVirtualGrid
            total={length + 1}
            cell={{ height: 210, width: 130 }}
            onRender={onMore || null}
            child={WrappedChild}
            childProps={{ ...childProps, more, moreIndex: length }}
            viewportOffset={2}
            scrollContainer={ref.current}
            scrollDirection={'horizontal'}
          />
        ) : (Array(length)
          .fill(null)
          .map((foo, index) => (
            <div key={stack ? (entities || [])[index]?.id || index : index} sx={styles.entity}>
              <Child {...childProps} index={index} />
            </div>
          ))
        )
      )}
      {!override && !(mobile && virtual && display === 'row') && !!more && ( //  && length >= 20
        <div sx={styles.more}>
          <More {...more} rotate={{ column: true, row: false }[display]} />
        </div>
      )}
    </div>
  )
}

UIList.styles = {
  row: {
    container: {
      left: '0em',
      display: 'flex',
      flexWrap: 'nowrap',
      alignItems: 'center',
      flexDirection: 'row',
      overflowX: 'auto',
      overflowY: 'hidden',
      paddingY: 4,
      paddingX: 8,
      scrollBehavior: 'auto', // ['auto', 'auto', 'smooth'],
    },
    entity: {
      flex: '0 0 auto',
      paddingX: [11, 8],
    },
    more: {
      flex: '0 0 auto',
      alignSelf: 'center',
      padding: '0 3em 0 2em',
    },
  },
  column: {
    container: {
      left: '0em',
      display: 'flex',
      flexWrap: 'nowrap',
      flexDirection: 'column',
      overflowX: 'hidden',
      overflowY: 'auto',
      paddingBottom: 2,
      scrollBehavior: 'auto', // ['auto', 'auto', 'smooth'],
    },
    entity: {
      display: 'flex',
      justifyContent: 'center',
      flex: '0 0 auto',
      padding: '1em 0',
    },
    more: {
      flex: '0 0 auto',
      alignSelf: 'center',
      paddingTop: '3em',
      fontSize: 6,
    },
  },
  wrap: {
    container: {
      left: '0em',
      display: 'flex',
      flexWrap: 'wrap',
      flexDirection: 'row',
      paddingY: 0,
      overflow: 'hidden',
    },
    entity: {
      flex: '0 0 auto',
      padding: '0.5em 0.25em',
    },
    more: {},
  },
}

export const List = memo(UIList)

export interface MoreProps extends Omit<BadgeProps, 'emoji' | 'label'>, Pick<LinkProps, 'to'>, Pick<LinkProps, 'state'> {
  rotate?: boolean
}

const UIMore = ({ to, state, title = '', rotate, ...props }: MoreProps) => {
  const emoji = useMemo(() => (
    <Icon value='more' sx={UIMore.styles.icon} style={{ transform: `rotate(${rotate ? 90 : 0}deg)` }} />
  ), [rotate])

  return (
    <Link sx={{ ...UIMore.styles.link, '>span': { padding: rotate ? '2em' : '2em 1.875em 2em 2.125em' } }} to={to} state={state} {...(title ? { title } : {})}>
      <Badge {...props} emoji={emoji} />
    </Link>
  )
}

UIMore.styles = {
  link: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: '100%',
    width: '100%',
  },
  icon: {
    display: 'flex',
    alignItems: 'center',
    height: '3.5em',
    padding: 8,
  },
}

export const More = memo(UIMore)
