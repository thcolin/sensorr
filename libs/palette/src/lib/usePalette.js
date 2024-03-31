import { useState, useEffect, useMemo } from 'react'
import { getImagePalette } from './palette'
import { useThemeUI } from 'theme-ui'

export function usePalette(url, initial, id) {
  const { colorMode } = useThemeUI()
  const cache = useMemo(() => {
    const raw = JSON.parse(sessionStorage.getItem(`${colorMode}-${id || url}`) || '{}')
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

    const cache = sessionStorage.getItem(`${colorMode}-${id || url}`)
    if (cache) {
      setPalette(JSON.parse(cache))
      setLoading(false)
      return
    }

    const controller = new AbortController()
    getImagePalette(url).then((p) => {
      if (controller.signal.aborted) {
        return
      }

      sessionStorage.setItem(`${colorMode}-${id || url}`, JSON.stringify(p))
      setPalette(p)
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
