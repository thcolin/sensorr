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
    <div>
      <div sx={UIHead.styles.container} style={{ height: expanded ? '40vw' : '25vw' }}>
        <Billboard path={billboard} palette={palette} ready={ready} onReady={onReady} size='original' fade={0.25} />
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
  container: {
    position: 'relative',
    width: '100%',
    minHeight: '40vh',
    maxHeight: '100vh',
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
    width: '100%',
    padding: 6,
    color: 'text',
    transition: 'opacity 400ms ease-in-out',
  }
}

export const Head = memo(UIHead)
