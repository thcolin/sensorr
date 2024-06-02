import { createContext, useCallback, useContext, useState } from 'react'
import usePortal from 'react-useportal'
import { Drawer, Link, List, Person, Picture } from '@sensorr/ui'

const detailsDrawerContext = createContext({})

const styles = {
  element: {
    flex: 1,
    maxHeight: '100%',
    display: 'flex',
    paddingTop: '2.25em',
  },
  title: {
    margin: 12,
    fontSize: 2,
    fontWeight: 'strong',
    lineHeight: 'body',
  },
  subtitle: {
    display: 'flex',
    alignItems: 'center',
    paddingBottom: 8,
    paddingTop: 10,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    '>span': {
      fontSize: 6,
      fontWeight: 'strong',
    },
    '>small': {
      fontSize: 6,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      fontWeight: 'semibold',
      opacity: 0.75,
    },
  },
  badges: {},
  guests: {
    fontSize: 9,
    // marginLeft: 6,
  },
  credits: {
    // marginTop: 4,
    // fontSize: 8,
    // '>div': {
    //   paddingX: 2,
    //   paddingBottom: 2,
    // },
  },
  overview: {
    flex: 1,
    marginTop: 8,
    fontFamily: 'heading',
    lineHeight: 'heading',
    fontWeight: 'medium',
    whiteSpace: 'pre-wrap',
    overflowY: 'auto',
    '>p': {
      margin: 12,
      fontSize: 6,
      textAlign: 'justify',
      lineHeight: 'body',
      overflow: 'hidden',
    }
  },
}

export const Provider = ({ children, ...props }) => {
  const { Portal, openPortal, closePortal, isOpen: isOpen } = usePortal({ closeOnOutsideClick: false, closeOnEsc: false, programmaticallyOpen: true })
  const [{ details, link, palette }, setData] = useState({ details: null, link: null, badges: null, credits: null, palette: null })
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
          {!!details && (
            <div sx={{ ...styles.element, backgroundColor: palette?.backgroundColor || 'grayLight' }}>
              <div
                sx={{
                  position: 'absolute',
                  height: '12em',
                  width: '100%',
                  top: '-7em',
                  display: 'flex',
                  alignItems: 'flex-end',
                  paddingX: '1em',
                  zIndex: 1,
                }}
                >
                <div
                  sx={{
                    height: '12em',
                    width: '8em',
                  }}
                >
                  <Picture
                    path={details.poster}
                    palette={{ backgroundColor: palette.color, color: palette.backgroundColor } as any}
                    lazy={false}
                  />
                </div>
                <div
                  sx={{
                    padding: 4,
                  }}
                >
                  {/* {badges?.reviews?.component && <badges.reviews.component {...({ ...badges?.reviews?.props, size: 'normal' })} palette={palette} />} */}
                </div>
              </div>
              <div
                sx={{
                  overflow: 'scroll',
                  marginTop: '3.5em',
                }}
              >
                <div
                  sx={{
                    paddingX: 4,
                  }}
                >
                  <h2 sx={styles.title} title={details.title} style={{ color: palette.color }}>
                    <Link to={link?.to} state={link?.state}>{details.title}</Link>
                  </h2>
                  <div sx={styles.subtitle} style={{ color: palette.alternativeColor }}>
                    {!!details?.meaningful?.year && (
                      <span>
                        <details.meaningful.year />
                        {(!!details?.meaningful?.genres || !!details?.caption) && <span sx={{ marginX: 8 }}>&nbsp;·&nbsp;</span>}
                      </span>
                    )}
                    {(!!details?.meaningful?.genres || !!details?.caption) && (
                      <small title={details?.caption}>
                        {!!details?.meaningful?.genres ? <details.meaningful.genres emoji={false} /> : details?.caption}
                      </small>
                    )}
                  </div>
                  <div sx={styles.badges}>
                    {/* {badges?.guests?.component && (
                      <div sx={styles.guests}>
                        <badges.guests.component {...badges?.guests?.props} />
                      </div>
                    )} */}
                  </div>
                  <div sx={styles.overview} style={{ color: palette.negativeColor }}>
                    <p>{details.overview}</p>
                  </div>
                </div>
                <div sx={styles.credits}>
                  {/* <List
                    id='details-drawer-credits'
                    length={10}
                    child={Credit}
                    childProps={{ entities: credits || [] }}
                    entities={credits}
                    // compact={true}
                    // space={2}
                    virtual={false}
                    stack={true}
                  /> */}
                </div>
              </div>
            </div>
          )}
        </Drawer>
      </Portal>
    </detailsDrawerContext.Provider>
  )
}

export const useDetailsDrawerContext = () => useContext(detailsDrawerContext) as ({ open: (details: any) => void, close: () => void })

const Credit = ({ index, entities, ...props }) => (
  <div sx={{ position: 'relative', zIndex: 0, '&:hover': { zIndex: 1 } }}>
    <Person
      {...props}
      display='poster'
      entity={entities[index]?.entity}
      link={(entity) => ({ to: entity?.id && `/person/${entity?.id}` })}
      state={entities[index]?.state}
    />
  </div>
)
