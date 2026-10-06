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

// Where the knob rests, in % of the screen: the drawer fills the screen, transparent above its sheet
const KNOB = 15

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
  const layer = useRef<HTMLDivElement>(null)

  // Follows the scroll itself: the knob rises with the sheet up to the top of the screen, where the poster
  // passes over it, and the band under it shows once the poster is gone, never late over it
  const onScroll = useCallback(() => {
    const poster = scroll.current?.querySelector('[data-drawer-poster]')

    if (!poster || !band.current) {
      return
    }

    const top = scroll.current.getBoundingClientRect().top
    const rest = window.innerHeight * KNOB / 100
    layer.current?.style.setProperty('--drawer-knob', `${Math.max(0, rest - scroll.current.scrollTop)}px`)
    band.current.style.opacity = `${Math.min(1, Math.max(0, (top - poster.getBoundingClientRect().bottom) / BAND_FADE))}`
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

    layer.current?.style.setProperty('--drawer-knob', `${KNOB}dvh`)
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
        <div ref={layer} style={{ '--drawer-knob': `${KNOB}dvh`, '--drawer-rest': `${KNOB}dvh`, '--drawer-content-layer': 'auto' } as any}>
          <Drawer
            close={close}
            open={isOpen}
            height='100dvh'
            background='transparent'
            pullable={true}
            knob={palette?.color || 'whitePure'}
          >
            <div ref={scroll} sx={styles.scroll} onScroll={onScroll} onClick={(e) => e.target === e.currentTarget && close()}>
              <div ref={band} sx={styles.band} style={{ backgroundColor: palette?.backgroundColor, opacity: 0 }} />
              {/* A poster in the drawer follows its link: the drawer does not open over itself */}
              <detailsDrawerContext.Provider value={{ open: null, close, leave }}>
                {behavior === 'movie' && <MovieContent key={id} id={id} variant='drawer' palette={palette} />}
                {behavior === 'tv' && <ShowContent key={id} id={id} variant='drawer' palette={palette} />}
              </detailsDrawerContext.Provider>
            </div>
          </Drawer>
        </div>
      </Portal>
    </detailsDrawerContext.Provider>
  )
}

export const useDetailsDrawerContext = () => useContext(detailsDrawerContext) as ({
  open: (details: any) => void
  close: () => void
  leave: (from: { key: string, pathname: string }) => void
})
