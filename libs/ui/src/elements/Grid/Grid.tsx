import { memo, useEffect, useMemo, useState } from 'react'
import { useResponsiveValue } from '@sensorr/utils'
import ResponsiveVirtualGrid from 'react-responsive-virtual-grid'

// Resolve the scroll container (`#body`) once it is available in the DOM. With
// `overlayscrollbars` the scrollable viewport is created asynchronously (after the grid mounts),
// so a one-shot lookup can miss it and the grid would freeze on a non-scrolling element. Retry on
// animation frames until `#body` exists, then hand the element to <ResponsiveVirtualGrid />.
const useScrollContainer = () => {
  const [scrollContainer, setScrollContainer] = useState<HTMLElement | null>(() => (
    typeof document !== 'undefined' ? document.getElementById('body') : null
  ))

  useEffect(() => {
    let raf
    let attempts = 0

    const resolve = () => {
      const element = document.getElementById('body')

      if (element) {
        setScrollContainer((current) => (current === element ? current : element))
      } else if (attempts++ < 60) {
        raf = requestAnimationFrame(resolve)
      }
    }

    resolve()
    return () => raf && cancelAnimationFrame(raf)
  }, [])

  return scrollContainer
}

const withGridItemContainer = () => (WrappedComponent) => {
  const withGridItemContainer = ({ style, index, readyInViewport, scrolling, ...props }) => (
    <div sx={{ ...UIGrid.styles.entity, ...style, ':hover': { zIndex: 1 } }}>
      <WrappedComponent {...props} index={index} placeholder={!readyInViewport} />
    </div>
  )

  withGridItemContainer.displayName = `withGridItemContainer(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return withGridItemContainer
}

export interface GridProps {
  length: number
  child: React.FC
  childProps?: any
  override?: React.ReactNode
  onMore?: () => void
  scrollPosition?: number
}

const UIGrid = ({
  length,
  override,
  child: Child,
  childProps,
  onMore,
  ...props
}: GridProps) => {
  const cell = useResponsiveValue([
    { height: 225, width: 120 },
    { height: 346, width: 204 },
  ])

  const scrollContainer = useScrollContainer()
  const WrappedChild = useMemo(() => withGridItemContainer()(Child), [Child])

  return !!override ? (
    <div sx={UIGrid.styles.block}>
      {override}
    </div>
  ) : (
    <ResponsiveVirtualGrid
      total={length}
      cell={cell}
      onRender={onMore || null}
      child={WrappedChild}
      childProps={childProps}
      viewportRowOffset={6}
      scrollContainer={scrollContainer}
    />
  )
}

UIGrid.styles = {
  block: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '25vh',
  },
  entity: {
    display: 'flex',
    justifyContent: 'center',
  }
}

export const Grid = memo((UIGrid))
