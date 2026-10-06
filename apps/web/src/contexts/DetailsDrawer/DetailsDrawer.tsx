import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import usePortal from 'react-useportal'
import { Drawer } from '@sensorr/ui'
import { historyEntryOf } from '@sensorr/utils'
import { MovieContent } from '../../pages/Movie/Movie'
import { ShowContent } from '../../pages/Shows/Show'

const detailsDrawerContext = createContext({})

// The scroll, in px past the poster, over which the band under the knob fades in
const BAND_FADE = 24

const styles = {
  scroll: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    overscrollBehavior: 'contain',
  },
  // Under the knob, once the poster standing out of the drawer has scrolled away
  band: {
    position: 'sticky',
    top: '0px',
    height: '2.25em',
    marginBottom: '-2.25em',
    zIndex: 1,
    pointerEvents: 'none',
  },
}

export const Provider = ({ children, ...props }) => {
  const { Portal, openPortal, closePortal, isOpen } = usePortal({ closeOnOutsideClick: false, closeOnEsc: false, programmaticallyOpen: true })
  const [{ link, palette }, setData] = useState({ link: null, palette: null })
  const [, behavior, id] = `${link?.to || ''}`.match(/^\/(movie|tv)\/(\d+)/) || []
  const location = useLocation()
  const navigationType = useNavigationType()
  const scroll = useRef<HTMLDivElement>(null)
  const band = useRef<HTMLDivElement>(null)

  // Follows the scroll itself, so a fast scroll back up never shows the band over the poster
  const onScroll = useCallback(() => {
    const poster = scroll.current?.querySelector('[data-drawer-poster]')

    if (!poster || !band.current) {
      return
    }

    const past = scroll.current.getBoundingClientRect().top - poster.getBoundingClientRect().bottom
    band.current.style.opacity = `${Math.min(1, Math.max(0, past / BAND_FADE))}`
  }, [])
  const opened = useRef(null)
  const loaded = useRef(location.key)
  const navigated = useRef(false)

  const open = useCallback(({ link, palette }) => {
    opened.current = { link: { to: link?.to }, palette }
    setData(opened.current)
    if (band.current) {
      band.current.style.opacity = '0'
    }
    openPortal()
  }, [])

  const close = useCallback(() => {
    opened.current = null
    sessionStorage.removeItem(`${historyEntryOf(location)}-drawer`)
    closePortal()
  }, [location.key])

  // Before a navigation: the drawer open on the page left is written down, to open again when coming back to it
  const leave = useCallback((from) => {
    const key = `${historyEntryOf(from)}-drawer`

    if (opened.current) {
      sessionStorage.setItem(key, JSON.stringify({ ...opened.current, scroll: scroll.current?.scrollTop || 0 }))
    } else {
      sessionStorage.removeItem(key)
    }

    opened.current = null
    closePortal()
  }, [])

  // Only after a navigation within the app: on a fresh load, the page would render before the config it reads
  useEffect(() => {
    navigated.current = navigated.current || location.key !== loaded.current

    if (!navigated.current) {
      return
    }

    const saved = navigationType === 'POP' && JSON.parse(sessionStorage.getItem(`${historyEntryOf(location)}-drawer`) || 'null')

    if (!saved) {
      return
    }

    open(saved)

    // The page in the drawer loads before it is as tall as it was
    const started = Date.now()
    const restore = () => {
      if (!scroll.current || scroll.current.scrollHeight - scroll.current.clientHeight < saved.scroll) {
        if (Date.now() - started < 5000) {
          requestAnimationFrame(restore)
        }

        return
      }

      scroll.current.scrollTop = saved.scroll
    }

    requestAnimationFrame(restore)
  }, [location.key, navigationType])

  return (
    <detailsDrawerContext.Provider {...props} value={{ open, close, leave }}>
      {children}
      <Portal>
        <Drawer
          close={close}
          open={isOpen}
          height='85vh'
          background='transparent'
          knob={palette?.color || 'whitePure'}
        >
          <div ref={scroll} sx={styles.scroll} onScroll={onScroll}>
            <div ref={band} sx={styles.band} style={{ backgroundColor: palette?.backgroundColor, opacity: 0 }} />
            {/* A poster in the drawer follows its link: the drawer does not open over itself */}
            <detailsDrawerContext.Provider value={{ open: null, close, leave }}>
              {behavior === 'movie' && <MovieContent key={id} id={id} variant='drawer' palette={palette} />}
              {behavior === 'tv' && <ShowContent key={id} id={id} variant='drawer' palette={palette} />}
            </detailsDrawerContext.Provider>
          </div>
        </Drawer>
      </Portal>
    </detailsDrawerContext.Provider>
  )
}

export const useDetailsDrawerContext = () => useContext(detailsDrawerContext) as ({
  open: (details: any) => void
  close: () => void
  leave: (from: { key: string, pathname: string }) => void
})
