import { useEffect, useState } from 'react'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'
import { useScrollPositionContext } from '../../contexts/ScrollPosition/ScrollPosition'

const Body = ({ overlayScrollbars = false, ...props }) => {
  const { ref, restoreScrollPosition } = useScrollPositionContext()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!ready) {
      setReady(true)
    }

    restoreScrollPosition()
  }, [ready])

  if (overlayScrollbars) {
    return (
      <OverlayScrollbarsComponent
        id='body'
        element='div'
        options={{ scrollbars: { autoHide: 'scroll' } }}
        defer={true}
        sx={Body.styles.overlayScrollbars.element}
        ref={(r) => {
          if (!r) {
            return
          }

          ref.current = r.getElement().firstElementChild as HTMLDivElement
        }}
        {...props}
      />
    )
  }

  return (
    <div id='body' ref={ref} {...props} sx={Body.styles.default.element}></div>
  )
}

Body.styles = {
  default: {
    element: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      flex: 1,
      backgroundColor: 'grayLightest',
      overflowY: 'auto',
      overflowX: 'hidden',
      overflowAnchor: 'none',
      scrollbarGutter: 'stable both-edges',
    },
  },
  overlayScrollbars: {
    element: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      flex: 1,
      backgroundColor: 'grayLightest',
      // overflowY: 'auto',
      // overflowX: 'hidden',
      // overflowAnchor: 'none',
    },
  },
}

export default Body
