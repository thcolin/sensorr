import { useCallback, useRef } from 'react'

export const useAbortController = () => {
  const controller = useRef(null)

  const abort = useCallback((reason = '') => {
    controller.current?.abort(reason)
    const next = new AbortController() as any
    next.signal.throwIfAborted = () => {
      if (next.signal.aborted) {
        throw new DOMException('AbortError', 'AbortError')
      }
    }
    controller.current = next
    return next
  }, [])

  return { controller, abort }
}
