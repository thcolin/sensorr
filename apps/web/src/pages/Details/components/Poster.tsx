import { memo, useMemo } from 'react'
import { Picture, Empty, Guests } from '@sensorr/ui'
import { avatar } from '@sensorr/utils'
import { useGuestsContext } from '../../../contexts/Guests/Guests'

const UIPoster = ({ path, palette, ready, onReady, behavior = 'movie', requested_by = [], ...props }) => {
  const guestsContext = useGuestsContext() as any
  const guests = useMemo(() => guestsContext.loading ? [] : (requested_by || []).reduce((guests, email) => [
    ...guests,
    { entity: { id: 0, name: guestsContext.guests[email].name, override: email, profile_path: guestsContext.guests[email].avatar } },
  ], []), [requested_by, guestsContext.loading, guestsContext.guests])

  return (
    <div sx={UIPoster.styles.element}>
      <Picture
        path={path}
        size='w780'
        palette={palette}
        ready={ready}
        onReady={onReady}
        empty={Empty[behavior]}
      />
      <div sx={UIPoster.styles.guests}>
        {!!requested_by?.length && (
          <Guests guests={guests} display='poster' compact={false} />
        )}
      </div>
    </div>
  )
}

UIPoster.styles = {
  element: {
    position: 'relative',
    height: ['18em', '24em'],
    width: ['12em', '16em'],
  },
  guests: {
    position: 'absolute',
    bottom: '0em',
    right: '0em',
    zIndex: 1,
  },
}

export const Poster = memo(UIPoster)
