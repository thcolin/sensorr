import { memo, useMemo } from 'react'
import { Picture, Empty, Guests, MovieState, PersonState, ShowState, reveal } from '@sensorr/ui'
import { useGuestsContext } from '../../../contexts/Guests/Guests'

const UIPoster = ({ path, palette, ready, onReady, behavior = 'movie', state, setState, requested_by = [], artworks = null, variant = 'page', ...props }) => {
  const guestsContext = useGuestsContext() as any
  const guests = useMemo(() => guestsContext.loading ? [] : (requested_by || []).reduce((guests, email) => [
    ...guests,
    { entity: { id: 0, name: guestsContext.guests[email].name, override: email, profile_path: guestsContext.guests[email].avatar } },
  ], []), [requested_by, guestsContext.loading, guestsContext.guests])

  // In the drawer, the badges sit where a grid poster carries them
  const drawer = variant === 'drawer'
  const badge = (style) => ({ ...style, ...reveal })
  const States = { movie: MovieState, tv: ShowState, person: PersonState }
  const State = States[behavior]

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
      {!!State && ready && state !== 'loading' && (
        <div sx={badge(drawer ? UIPoster.styles.astride : UIPoster.styles.state)}>
          <State value={state} onChange={setState} compact={true} aria-label='State' />
        </div>
      )}
      {!!artworks && ready && <div sx={badge(drawer ? UIPoster.styles.compact : UIPoster.styles.artworks)}>{artworks}</div>}
      {ready && !!guests.length && (
        <div sx={badge(UIPoster.styles.guests)}>
          <Guests guests={guests} display='poster' compact={false} to={behavior === 'tv' ? '/tv/requests' : '/movie/requests'} />
        </div>
      )}
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
    // The badge stays its size, its select reaches the 44px a finger needs
    'select': {
      top: '-0.375em',
      left: '-0.375em',
      height: 'calc(100% + 0.75em)',
      width: 'calc(100% + 0.75em)',
    },
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
