import { memo, useMemo } from 'react'
import { Picture, Empty, Guests, MovieState, PersonState } from '@sensorr/ui'
import { useGuestsContext } from '../../../contexts/Guests/Guests'

const UIPoster = ({ path, palette, ready, onReady, behavior = 'movie', state, setState, requested_by = [], ...props }) => {
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
        lazy={false}
        // sx={{ viewTransitionName: 'poster' }}
      />
      {behavior === 'movie' && (
        <div sx={UIPoster.styles.state}>
          <MovieState
            value={ready ? state : 'loading'}
            onChange={setState}
            compact={true}
          />
        </div>
      )}
      {behavior === 'person' && (
        <div sx={UIPoster.styles.state}>
          <PersonState
            value={ready ? state : 'loading'}
            onChange={setState}
            compact={true}
          />
        </div>
      )}
      <div sx={UIPoster.styles.guests}>
        {!!requested_by?.length && (
          <Guests guests={guests} display='poster' compact={false} space={4} />
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
    bottom: ['-1rem', '-2rem'],
    right: ['-1rem', '-2rem'],
    fontSize: [10, 9],
    zIndex: 1,
  },
  state: {
    position: 'absolute',
    top: '0.75em',
    right: '0.75em',
    fontSize: 3,
    zIndex: 1,
  },
}

export const Poster = memo(UIPoster)
