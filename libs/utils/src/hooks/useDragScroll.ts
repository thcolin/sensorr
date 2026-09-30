import { MutableRefObject, useCallback, useRef } from 'react'
import { useScrollContainer } from 'react-indiana-drag-scroll'

// A mouse grabs the element to scroll it, with inertia and a rubber band at the edges; a touch keeps
// the native scroll. The release that ends a drag is not a click. Returns the ref to put on the element.
export const useDragScroll = <T extends HTMLElement>(ref?: MutableRefObject<T>, enabled = true) => {
  const { ref: container } = useScrollContainer({ mouseScroll: enabled && { activationDistance: 10 } })
  const node = useRef<T>(null)
  const active = useRef(enabled)
  active.current = enabled

  const grab = useCallback((e: MouseEvent) => {
    const element = e.currentTarget as HTMLElement
    element.style.cursor = active.current && element.scrollWidth > element.clientWidth ? 'grab' : ''
  }, [])

  const prevent = useCallback((e: DragEvent) => {
    if (active.current) {
      e.preventDefault()
    }
  }, [])

  return useCallback((element: T) => {
    node.current?.removeEventListener('mouseenter', grab)
    node.current?.removeEventListener('dragstart', prevent)
    element?.addEventListener('mouseenter', grab)
    // A poster is a link around an image: without this, grabbing it starts the browser's own drag
    element?.addEventListener('dragstart', prevent)
    node.current = element
    container(element)

    if (ref) {
      ref.current = element
    }
  }, [])
}
