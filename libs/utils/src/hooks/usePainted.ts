import { useEffect, useState } from 'react'

// False until two frames after mount. react-router resolves a view transition's update from an
// effect, so what waits on this renders after the transition has captured the new page.
export const usePainted = () => {
  const [painted, setPainted] = useState(false)

  useEffect(() => {
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setPainted(true))
    })

    return () => cancelAnimationFrame(frame)
  }, [])

  return painted
}
