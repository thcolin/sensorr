import React, { useCallback, useMemo } from 'react'
import ResponsiveVirtualGrid from 'react-responsive-virtual-grid'

const VirtualGrid = ({
  total,
  renderChild,
  override,
  onMore,
  ...props
}) => {
  const cell = useMemo(() => ({ height: 304, width: 192 }))
  const render = useCallback(({ style, key, index }) => (
    <div key={key} style={{ display: 'flex', justifyContent: 'center', ...style }}>
      {renderChild(index)}
    </div>
  ), [renderChild])

  return !!override ? (
    <div css={VirtualGrid.styles.block}>
      {override}
    </div>
  ) : (
    <ResponsiveVirtualGrid
      total={total}
      cell={cell}
      onRender={onMore}
      render={render}
    />
  )
}

VirtualGrid.styles = {
  block: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '25vh',
  },
}

export default VirtualGrid
