import { useCallback, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'

export const DELAY = 5000

// A verdict waits `DELAY` in the `proposal-pending` toast before `send` gets it, so it can be undone, or a
// refusal turned into a ban. `hold` sets the one waiting, `flush` sends it now.
// Leaving the page sends what is waiting rather than dropping it; closing the tab asks first, so the request
// has time to leave.
export const usePendingVerdict = ({ send, onUndo = null }: { send: (current: any) => any, onUndo?: (current: any) => void }) => {
  const pending = useRef(null)

  const flush = useCallback(() => {
    const current = pending.current

    if (!current) {
      return
    }

    clearTimeout(current.timer)
    pending.current = null
    send(current)
  }, [send])

  const hold = useCallback((current) => {
    clearTimeout(pending.current?.timer)
    pending.current = { ...current, timer: setTimeout(flush, DELAY) }
  }, [flush])

  const undo = useCallback(() => {
    const current = pending.current

    if (!current) {
      return
    }

    clearTimeout(current.timer)
    pending.current = null
    toast.dismiss('proposal-pending')
    onUndo?.(current)
  }, [onUndo])

  useEffect(() => () => flush(), [flush])

  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (pending.current) {
        flush()
        e.preventDefault()
      }
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [flush])

  return { pending, hold, flush, undo }
}
