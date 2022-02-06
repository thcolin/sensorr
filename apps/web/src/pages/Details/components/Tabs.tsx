import { cloneElement, isValidElement, useCallback, useEffect, useMemo, useState } from 'react'
import { Entities } from '@sensorr/ui'
import { createHistoryState } from '@sensorr/utils'
import { useTranslation } from 'react-i18next'
import nanobounce from 'nanobounce'

const withTabsBehavior = () => (WrappedComponent) => {
  const withTabsBehavior = ({ id, tabs, palette, ...props }) => {
    const { t } = useTranslation()
    const useHistoryState = useMemo(() => createHistoryState(`tabs-${id}`, null), [id])
    // TODO: Should keep previous value
    const [current, setCurrent] = useHistoryState() as [any, any]
    const debounce = useMemo(() => nanobounce(400), [])
    const [label, setLabel] = useState(current)
    const [ready, setReady] = useState(true)

    const handleSelectTab = useCallback((key) => {
      setLabel(key)
      setReady(false)
      debounce(() => {
        setCurrent(key)
        setReady(true)
      })
    }, [id])

    useEffect(() => {
      if (!tabs[current]) {
        setLabel(Object.keys(tabs)[0])
        setCurrent(Object.keys(tabs)[0])
      }
    }, [id, tabs])

    if (!Object.keys(tabs).length) {
      return null
    }

    const tab = tabs[current] || tabs[Object.keys(tabs)[0]]

    return (
      <WrappedComponent
        {...props}
        {...tab}
        props={(obj) => ({ ...(tab.props && tab.props(obj)), palette })}
        ready={tab?.ready !== false && ready}
        label={(
          <div>
            {((tab?.ready !== false ? Object.entries(tabs) : [['loading', { label: t('tabs.loading') }]]) as [string, any]).map(([key, { label: children }]) => isValidElement(children) ? cloneElement(children, { key }) : (
              <button
                key={key}
                sx={{
                  variant: 'button.reset',
                  transition: 'opacity 400ms ease-in-out',
                  marginX: 4,
                  fontSize: '1.125em',
                  ...(key !== label && { opacity: 0.5 }),
                  ':first-of-type': {
                    marginLeft: 12,
                  },
                }}
                onClick={() => handleSelectTab(key)}
              >
                {children}
              </button>
            ))}
          </div>
        )}
      />
    )
  }

  withTabsBehavior.displayName = `withTabsBehavior(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return withTabsBehavior
}

export const Tabs = withTabsBehavior()(Entities)
