import { memo } from 'react'
import { Picture, Empty } from '@sensorr/ui'

const UIPoster = ({ path, palette, ready, onReady, behavior = 'movie', ...props }) => (
  <div sx={UIPoster.styles.element}>
    <Picture
      path={path}
      size='w780'
      palette={palette}
      ready={ready}
      onLoad={onReady}
      onError={onReady}
      empty={Empty[behavior]}
    />
  </div>
)

UIPoster.styles = {
  element: {
    height: ['18em', '24em'],
    width: ['12em', '16em'],
  },
}

export const Poster = memo(UIPoster)
