import { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import { Cast, Collection, Crew, Movie, Person } from '@sensorr/tmdb'
import { useHistoryState } from '@sensorr/utils'
import { Badge, BadgeProps } from '../../atoms/Badge/Badge'
import { Icon } from '../../atoms/Icon/Icon'
import { Link, LinkProps } from '../../atoms/Link/Link'
import nanobounce from 'nanobounce'

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
  more?: Omit<MoreProps, 'rotate'>
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
  more = null,
  space = 4,
}: ListProps) => {
  const ref = useRef<HTMLDivElement>()
  const scrollDebouncer = useMemo(() => nanobounce(100), [])
  const resetDebouncer = useMemo(() => nanobounce(500), [])
  const resetScroll = useCallback(([x, y]) => ref.current && ref.current.scroll(x, y), [ref.current])
  const [scroll, setScroll] = useHistoryState(`${id}-scroll`, [0, 0])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    scrollDebouncer(() => setScroll([ref.current?.scrollLeft || 0, ref.current?.scrollTop || 0]))
  }, [id])

  useEffect(() => {
    if (!stack) {
      resetDebouncer(() => resetScroll(scroll))
    }
  }, [id])

  const styles = useMemo(() => ({
    ...UIList.styles[display],
    container: {
      ...UIList.styles[display].container,
      ...(compact ? { paddingY: 12 } : {}),
    },
    entity: {
      ...UIList.styles[display].entity,
      ...(compact ? {
        padding: '0em',
        ':not(:last-of-type)': {
          marginRight: `-${space}em`,
        },
      } : {}),
    },
  }), [display, compact])

  return (
    <div ref={ref} sx={styles.container} onScroll={handleScroll}>
      {override || (Array(length)
        .fill(null)
        .map((foo, index) => (
          <div key={stack ? (entities || [])[index]?.id || index : index} sx={styles.entity}>
            <Child {...childProps} index={index} />
          </div>
        ))
      )}
      {!override && !!more && ( //  && length >= 20
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
      paddingBottom: 0,
      scrollBehavior: 'smooth',
    },
    entity: {
      flex: '0 0 auto',
      padding: '0 2em',
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
      paddingY: 2,
      scrollBehavior: 'smooth',
    },
    entity: {
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
    <Link sx={UIMore.styles.link} to={to} state={state} {...(title ? { title } : {})}>
      <Badge {...props} emoji={emoji} label='' color='auto' />
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
    color: 'gray',
    height: '3.5em',
    padding: 8,
  },
}

export const More = memo(UIMore)
