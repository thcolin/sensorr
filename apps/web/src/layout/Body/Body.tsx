import { useEffect, useState } from 'react'
import { useScrollPositionContext } from '../../contexts/ScrollPosition/ScrollPosition'

const Body = ({ ...props }) => {
  const { ref, restoreScrollPosition } = useScrollPositionContext()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!ready) {
      setReady(true)
    }

    restoreScrollPosition()
  }, [ready])

  return (
    <div id='body' ref={ref} {...props} sx={Body.styles.element}></div>
  )
}

Body.styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    flex: 1,
    backgroundColor: 'grayLightest',
    overflowY: 'auto',
    overflowAnchor: 'none',
  },
}

export default Body
