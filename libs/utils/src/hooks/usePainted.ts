import { useEffect, useState } from 'react'

// False until two frames after mount: what waits on it renders once the screen has been painted,
// and so after a view transition has captured the new page.
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
