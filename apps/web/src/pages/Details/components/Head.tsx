import { memo, useEffect } from 'react'
import { Billboard, Icon } from '@sensorr/ui'
import { useExpandContext } from '../contexts/Expand'
import { Player } from './Player'

const UIHead = ({ billboard, palette, entity, ready, onReady, ...props }) => {
  const { expanded, setExpanded } = useExpandContext() as any

  useEffect(() => {
    setExpanded(false)
  }, [entity.id])

  return (
    <div sx={UIHead.styles.element}>
      <div sx={UIHead.styles.container} style={{ height: expanded ? '40vw' : '25vw' }}>
        <Billboard path={billboard} palette={palette} ready={ready} onReady={onReady} lazy={false} size='original' fade={0.25} blur={4} />
        <div sx={UIHead.styles.player} style={{ color: palette.color }}>
          <Player entity={entity} ready={ready} />
        </div>
      </div>
      <button onClick={() => setExpanded(false)} disabled={!expanded} sx={UIHead.styles.reduce} style={{ opacity: expanded ? 1 : 0 }}>
        <Icon value='chevron' direction={true} width='1em' height='1em' />
      </button>
    </div>
  )
}

UIHead.styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
  },
  container: {
    position: 'relative',
    width: '100%',
    minHeight: '40vh',
    maxHeight: '100dvh',
    overflow: 'hidden',
    transition: 'height 400ms ease-in-out',
  },
  player: {
    top: '0em',
    position: 'absolute',
    height: '100%',
    width: '100%',
  },
  reduce: {
    variant: 'button.reset',
    flex: 1,
    marginLeft: 4,
    marginRight: 4,
    marginTop: 6,
    marginBottom: 6,
    backgroundColor: 'whiteDarker',
    paddingTop: 6,
    paddingBottom: 8,
    color: 'text',
    transition: 'opacity 400ms ease-in-out, background-color 200ms ease-in-out',
    ':hover': {
      backgroundColor: 'whiteDarkest',
    }
  }
}

export const Head = memo(UIHead)
