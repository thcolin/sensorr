import React, { useCallback, useEffect, useState, useMemo } from 'react'
import nanobounce from 'nanobounce'

const List = ({
  entities,
  total,
  renderChild,
  override,
  options: {
    display = 'row',
    stack = false,
    space = 2,
  },
  ...props
}) => {
  const styles = List.styles[display]
  const [ref, setRef] = useState(null)
  const debounce = useMemo(() => nanobounce(200), [])
  const resetScroll = useCallback(() => ref && ref.scroll(0, 0), [ref])

  useEffect(() => {
    debounce(() => resetScroll())
  }, [entities, total, renderChild])

  return (
    <div ref={(el) => setRef(el)} css={styles.container}>
      {override || Array(total).fill(null).map((_, index) => (
        <div
          key={stack ? (entities[index]?.id || index) : index}
          css={styles.entity}
          style={{
            padding: { row: `0 ${space}em`, column: `${space}em 0` }[display],
          }}
        >
          {renderChild(index)}
        </div>
      ))}
    </div>
  )
}

List.styles = {
  row: {
    container: {
      left: 0,
      display: 'flex',
      flexWrap: 'nowrap',
      alignItems: 'flex-start',
      flexDirection: 'row',
      overflowX: 'auto',
      overflowY: 'hidden',
      padding: '2em 0',
    },
    entity: {
      flex: '0 0 auto',
    },
  },
  column: {
    container: {
      left: 0,
      display: 'flex',
      flexWrap: 'nowrap',
      flexDirection: 'column',
      overflowX: 'hidden',
      overflowY: 'auto',
    },
    entity: {
      flex: '0 0 auto',
    },
  },
}

export default List
