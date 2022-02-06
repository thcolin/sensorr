import { useState, useEffect, useMemo } from 'react'
import { getImagePalette } from './palette'

export function usePalette(url, initial, id) {
  const [palette, setPalette] = useState(null)
  const [loading, setLoading] = useState(true)
  const colorMode = 'default'

  useEffect(() => {
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

    return () => controller.abort()
  }, [url])

  return {
    palette: palette || initial,
    loading
  }
}
