import { createContext, useCallback, useContext, useState } from 'react'
import usePortal from 'react-useportal'
import { Drawer } from '@sensorr/ui'
import { MovieContent } from '../../pages/Movie/Movie'
import { ShowContent } from '../../pages/Shows/Show'

const detailsDrawerContext = createContext({})

const styles = {
  scroll: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    overscrollBehavior: 'contain',
  },
}

export const Provider = ({ children, ...props }) => {
  const { Portal, openPortal, closePortal, isOpen } = usePortal({ closeOnOutsideClick: false, closeOnEsc: false, programmaticallyOpen: true })
  const [{ link, palette }, setData] = useState({ link: null, palette: null })
  const [, behavior, id] = `${link?.to || ''}`.match(/^\/(movie|tv)\/(\d+)/) || []

  const open = useCallback(data => {
    setData(data)
    openPortal()
  }, [])

  const close = useCallback(() => {
    closePortal()
  }, [])

  return (
    <detailsDrawerContext.Provider {...props} value={{ open, close }}>
      {children}
      <Portal>
        <Drawer
          close={close}
          open={isOpen}
          height='75vh'
          background={palette?.backgroundColor || 'grayLight'}
          knob={palette?.color || 'whitePure'}
        >
          {/* A poster in the drawer follows its link: the drawer does not open over itself */}
          <div sx={styles.scroll}>
            <detailsDrawerContext.Provider value={{ open: null, close }}>
              {behavior === 'movie' && <MovieContent key={id} id={id} variant='drawer' />}
              {behavior === 'tv' && <ShowContent key={id} id={id} variant='drawer' />}
            </detailsDrawerContext.Provider>
          </div>
        </Drawer>
      </Portal>
    </detailsDrawerContext.Provider>
  )
}

export const useDetailsDrawerContext = () => useContext(detailsDrawerContext) as ({ open: (details: any) => void, close: () => void })
