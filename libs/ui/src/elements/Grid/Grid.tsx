import { memo, useMemo } from 'react'
import { useResponsiveValue } from '@sensorr/utils'
import ResponsiveVirtualGrid from 'react-responsive-virtual-grid'

const withGridItemContainer = () => (WrappedComponent) => {
  const withGridItemContainer = ({ style, index, readyInViewport, scrolling, ...props }) => (
    <div style={{ ...UIGrid.styles.entity, ...style }}>
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
      scrollContainer={document.getElementById('body')}
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
