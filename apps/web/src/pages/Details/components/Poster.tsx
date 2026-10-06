import { memo, useMemo } from 'react'
import { Picture, Empty, Guests, MovieState, PersonState, ShowState } from '@sensorr/ui'
import { useGuestsContext } from '../../../contexts/Guests/Guests'

const UIPoster = ({ path, palette, ready, onReady, behavior = 'movie', state, setState, requested_by = [], artworks = null, variant = 'page', ...props }) => {
  const guestsContext = useGuestsContext() as any
  const guests = useMemo(() => guestsContext.loading ? [] : (requested_by || []).reduce((guests, email) => [
    ...guests,
    { entity: { id: 0, name: guestsContext.guests[email].name, override: email, profile_path: guestsContext.guests[email].avatar } },
  ], []), [requested_by, guestsContext.loading, guestsContext.guests])

  // In the drawer, the badges sit where a grid poster carries them and show once the poster has
  const drawer = variant === 'drawer'
  const badge = (style) => drawer ? { ...style, ...UIPoster.styles.reveal(ready) } : style

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
        <div sx={drawer ? badge(UIPoster.styles.astride) : UIPoster.styles.state}>
          <MovieState
            value={ready ? state : 'loading'}
            onChange={setState}
            compact={true}
          />
        </div>
      )}
      {behavior === 'tv' && (
        <div sx={drawer ? badge(UIPoster.styles.astride) : UIPoster.styles.state}>
          <ShowState
            value={ready ? state : 'loading'}
            onChange={setState}
            compact={true}
          />
        </div>
      )}
      {behavior === 'person' && (
        <div sx={drawer ? badge(UIPoster.styles.astride) : UIPoster.styles.state}>
          <PersonState
            value={ready ? state : 'loading'}
            onChange={setState}
            compact={true}
          />
        </div>
      )}
      {!!artworks && (drawer || ready) && <div sx={badge(drawer ? UIPoster.styles.compact : UIPoster.styles.artworks)}>{artworks}</div>}
      <div sx={badge(UIPoster.styles.guests)}>
        {!!requested_by?.length && (
          <Guests guests={guests} display='poster' compact={false} to={behavior === 'tv' ? '/tv/requests' : '/movie/requests'} />
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
    fontSize: '1rem',
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
  reveal: (ready) => ({
    opacity: ready ? 1 : 0,
    visibility: ready ? 'visible' : 'hidden',
    // After the poster's own fade, 400ms after a 400ms delay
    transition: ready ? 'opacity 400ms ease-in-out 900ms' : 'none',
  }),
  // At the size of the state badge
  compact: {
    position: 'absolute',
    bottom: '-1.1em',
    left: '-1.1em',
    fontSize: 3,
    zIndex: 1,
    '>button': {
      height: '1.75em',
      width: '1.75em',
    },
  },
  astride: {
    position: 'absolute',
    top: '-1em',
    right: '-1.25em',
    fontSize: 3,
    zIndex: 1,
  },
  // Astride the corner, half its size out of the poster
  artworks: {
    position: 'absolute',
    bottom: ['-1.1em', '-1em'],
    left: ['-1.1em', '-1em'],
    fontSize: 3,
    zIndex: 1,
  },
}

export const Poster = memo(UIPoster)
