import { useEffect, useState } from 'react'
import { OverlayScrollbars } from 'overlayscrollbars'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'
import { useTouchable } from '@sensorr/utils'
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

  // On a touch device whose native scrollbars already overlay the content, the library brings nothing
  // and its synchronous setup forces layout inside the screen transition.
  const touchable = useTouchable()
  const { x, y } = OverlayScrollbars.env().scrollbarsOverlaid

  if (overlayScrollbars && !(touchable && x && y)) {
    return (
      <OverlayScrollbarsComponent
        element='div'
        options={{ scrollbars: { autoHide: 'scroll' } }}
        defer={false}
        sx={Body.styles.overlayScrollbars.element}
        events={{
          initialized: (instance) => {
            // OverlayScrollbars wraps the content in a dedicated viewport element which is
            // the one actually scrolling. Expose it as `#body` (the app-wide scroll container
            // contract used by `scrollToTop` and the VirtualGrid) and track it for scroll restoration.
            const viewport = instance.elements().viewport as HTMLDivElement
            viewport.id = 'body'
            ref.current = viewport
            restoreScrollPosition()
          },
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
