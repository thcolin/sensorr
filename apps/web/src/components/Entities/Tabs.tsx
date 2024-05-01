import { useEffect, useMemo, useState } from 'react'
import { Entities } from '@sensorr/ui'
import { useHistoryState } from '@sensorr/utils'
import { useTranslation } from 'react-i18next'
import nanobounce from 'nanobounce'

export const withTabsBehavior = () => (WrappedComponent) => {
  const withTabsBehavior = ({ id, tabs, ...props }) => {
    const { t } = useTranslation()
    const [current, setCurrent] = useHistoryState(`${id}-tab`, null)
    const [optimistic, setOptimistic] = useState(null)
    const debounce = useMemo(() => nanobounce(400), [])
    const [ready, setReady] = useState(true)

    useEffect(() => {
      setOptimistic(current || Object.keys(tabs)[0])
    }, [tabs, current])

    if (!Object.keys(tabs).length) {
      return null
    }

    const tab = tabs[current] || tabs[Object.keys(tabs)[0]]
    const [, setScroll] = useHistoryState(`${tab?.id}-scroll`, [0, 0])

    return (
      <WrappedComponent
        {...props}
        {...tab}
        props={(obj) => ({ ...(props.props && props.props(obj)), ...(tab.props && tab.props(obj)) })}
        ready={ready && tab?.ready !== false}
        label={(
          <>
            {((tab?.ready !== false ? Object.entries(tabs) : [['loading', { label: t('tabs.loading') }]]) as [string, any]).map(([key, { label: children }]) => (
              <button
                key={key}
                sx={{
                  variant: 'button.reset',
                  transition: 'opacity 400ms ease-in-out',
                  paddingY: 8,
                  marginX: 4,
                  fontFamily: 'heading',
                  fontWeight: 'strong',
                  ...(key !== optimistic && { opacity: 0.5 }),
                  whiteSpace: 'nowrap',
                  ':first-of-type': {
                    marginLeft: 12,
                  },
                }}
                onClick={() => {
                  setScroll([0, 0])
                  setReady(false)
                  setOptimistic(key)
                  debounce(() => {
                    setCurrent(key)
                    setReady(true)
                  })
                }}
              >
                {children}
              </button>
            ))}
          </>
        )}
      />
    )
  }

  withTabsBehavior.displayName = `withTabsBehavior(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return withTabsBehavior
}

export const Tabs = withTabsBehavior()(Entities)
