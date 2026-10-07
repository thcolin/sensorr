import { useState, useEffect, useMemo } from 'react'
import { getImagePalette } from './palette'
import { useThemeUI } from 'theme-ui'

export function usePalette(url, initial, id) {
  const { colorMode } = useThemeUI()
  // Versioned: a palette cached by an older computation is computed again
  const key = `${colorMode}-palette-2-${id || url}`
  const cache = useMemo(() => {
    const raw = JSON.parse(sessionStorage.getItem(key) || '{}')
    return raw.backgroundColor ? raw : null
  }, [url, id])

  const [palette, setPalette] = useState(cache || null)
  const [loading, setLoading] = useState(!cache || true)

  useEffect(() => {
    setLoading(true)

    if (!url) {
      setPalette(null)
      setLoading(false)
      return
    }

    const cache = sessionStorage.getItem(key)
    if (cache) {
      setPalette(JSON.parse(cache))
      setLoading(false)
      return
    }

    // Back to the initial colors while the new one computes: the previous image's would show for this one
    setPalette(null)
    const controller = new AbortController()
    getImagePalette(url).then((p) => {
      if (controller.signal.aborted) {
        return
      }

      // Without a palette, the initial colors stand as its own: what waits on the colors shows in them
      if (p) {
        sessionStorage.setItem(key, JSON.stringify(p))
      }

      setPalette(p || initial)
      setLoading(false)
    })

    return () => {
      controller.abort()
      setLoading(false)
    }
  }, [url, id])

  return {
    palette: palette || initial,
    loading,
    initial: !palette && !!initial,
  }
}
