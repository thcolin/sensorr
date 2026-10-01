import { useState } from 'react'

// The Plex picture of a friend, or their initial when there is none or it does not load
export const Face = ({ person }: { person: { avatar?: string, name?: string, email?: string } }) => {
  const [broken, setBroken] = useState(false)

  return person.avatar && !broken
    ? <img src={person.avatar} alt='' loading='lazy' onError={() => setBroken(true)} sx={Face.styles.picture} />
    : <span sx={Face.styles.initial}>{(person.name || person.email || '?')[0]}</span>
}

Face.styles = {
  picture: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  initial: {
    display: 'grid',
    placeItems: 'center',
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    backgroundColor: 'gray',
    color: 'grayDarkest',
    fontFamily: 'heading',
    fontWeight: 'heading',
    textTransform: 'uppercase',
  },
}
