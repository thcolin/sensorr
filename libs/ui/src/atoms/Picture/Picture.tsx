import { memo, useState, useMemo, useEffect, useRef } from 'react'
import { Palette } from '@sensorr/palette'

export const Empty = {
  movie: memo(({ ...props }) => (
    <svg {...props} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'>
      <path
        fill='currentColor'
        d='M488 64h-8v20c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12V64H96v20c0 6.6-5.4 12-12 12H44c-6.6 0-12-5.4-12-12V64h-8C10.7 64 0 74.7 0 88v336c0 13.3 10.7 24 24 24h8v-20c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v20h320v-20c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v20h8c13.3 0 24-10.7 24-24V88c0-13.3-10.7-24-24-24zM96 372c0 6.6-5.4 12-12 12H44c-6.6 0-12-5.4-12-12v-40c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40zm0-96c0 6.6-5.4 12-12 12H44c-6.6 0-12-5.4-12-12v-40c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40zm0-96c0 6.6-5.4 12-12 12H44c-6.6 0-12-5.4-12-12v-40c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40zm272 208c0 6.6-5.4 12-12 12H156c-6.6 0-12-5.4-12-12v-96c0-6.6 5.4-12 12-12h200c6.6 0 12 5.4 12 12v96zm0-168c0 6.6-5.4 12-12 12H156c-6.6 0-12-5.4-12-12v-96c0-6.6 5.4-12 12-12h200c6.6 0 12 5.4 12 12v96zm112 152c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40zm0-96c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40zm0-96c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40z'
      />
    </svg>
  )),
  person: memo(({ ...props }) => (
    <svg {...props} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 448 512'>
      <path
        fill='currentColor'
        d='M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm89.6 32h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4z'
      />
    </svg>
  )),
  default: memo(({ ...props }) => (
    <svg {...props} xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2400 2400'>
      <path
        fill='currentColor'
        d='M88 2219c-24.7 0-45.5-8.5-62.5-25.5S0 2156 0 2132V307c0-24.7 8.5-45.5 25.5-62.5S63.3 219 88 219h2224c24.7 0 45.5 8.5 62.5 25.5s25.5 37.8 25.5 62.5v1825c0 24-8.5 44.5-25.5 61.5s-37.8 25.5-62.5 25.5H88zm112-300l606-400c24.7 10 56.7 23.2 96 39.5s104.5 46.2 195.5 89.5 164.2 82.3 219.5 117c22.7 14.7 39.7 22 51 22 10 0 15-6 15-18 0-22.7-15-58.3-45-107s-68-97.3-114-146-87.7-81-125-97c29.3-29.3 74.3-77.3 135-144s113.7-126 159-178l69-78 5.5-5.5 15.5-14 24-20 30-21 36-20 39-14 41-5.5c18 0 37 3.5 57 10.5s37.8 15.3 53.5 25 30 19.3 43 29 23.2 18.2 30.5 25.5l10 10 353 358V419H200v1500zm400-881c-60 0-111.5-21.5-154.5-64.5S381 879 381 819s21.5-111.5 64.5-154.5S540 600 600 600c39.3 0 75.8 9.8 109.5 29.5s60.3 46.3 80 80S819 779.7 819 819c0 60-21.5 111.5-64.5 154.5S660 1038 600 1038z'
      />
    </svg>
  )),
}

export interface PictureProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'onLoad'> {
  path: string
  size?: 'w45' | 'w92' | 'w154' | 'w185' | 'w300' | 'w342' | 'w500' | 'w780' | 'h632' | 'original'
  ready?: boolean
  palette?: Palette
  empty?: React.FC<any>
  onReady?: (event: any, error: boolean) => void
}

export interface MoviePictureProps extends PictureProps {
  size?: 'w92' | 'w154' | 'w185' | 'w300' | 'w342' | 'w500' | 'w780' | 'original'
}

export interface PersonPictureProps extends PictureProps {
  size?: 'w45' | 'w185' | 'w300' | 'h632' | 'original'
}

function UIPicture({
  path,
  size = 'w300',
  ready = true,
  palette = null,
  empty: Empty,
  onReady,
  ...props
}: PictureProps) {
  const ref = useRef(null)
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const src = path ? (path.startsWith('data:image/') || path.startsWith('http')) ? path : `https://image.tmdb.org/t/p/${size}${path}` : null

  const onLoadProps = useMemo(() => ({
    onLoad: (e) => {
      setLoaded(true)
      setError(false)

      if (typeof onReady === 'function') {
        onReady(e, false)
      }
    },
    onError: (e) => {
      setLoaded(true)
      setError(true)

      if (typeof onReady === 'function') {
        onReady(e, true)
      }
    }
  }), [onReady])

  const styles = {
    element: {
      ...(palette ? { backgroundColor: palette.backgroundColor, color: palette.color } : {}),
    },
    empty: {
      opacity: (ready && !src) || error ? 1 : 0,
    },
    image: {
      opacity: loaded && ready && src && !error ? 1 : 0,
      transitionDelay: loaded && ready ? '400ms' : '0ms',
      // transitionDuration: loaded && ready ? '400ms' : '0ms',
    },
  }

  useEffect(() => {
    setLoaded(false)
    setError(false)

    if (!path || path.startsWith('data:image/')) {
      onLoadProps.onLoad(null)
    }
  }, [path, size])

  useEffect(() => {
    if (!loaded && ref.current?.complete) {
      setLoaded(true)
      setError(false)

      if (typeof onReady === 'function') {
        onReady(null, false)
      }
    }
  })

  return (
    <span {...props} sx={UIPicture.styles.element} style={styles.element}>
      {!!Empty && <Empty style={styles.empty} sx={UIPicture.styles.empty} />}
      <img ref={ref} {...onLoadProps} src={src} sx={UIPicture.styles.image} style={styles.image as any} loading='lazy' decoding='async' />
    </span>
  )
}

UIPicture.styles = {
  element: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
    minHeight: '4em',
    backgroundColor: 'grayLight',
    color: 'grayDark',
    transition: 'background-color 800ms ease-in-out, color 800ms ease-in-out',
  },
  empty: {
    position: 'absolute',
    height: '33%',
    width: '33%',
    display: 'block',
    transition: 'opacity 400ms ease-in-out',
  },
  image: {
    height: '100%',
    width: '100%',
    objectFit: 'cover',
    objectPosition: 'center center',
    transition: 'opacity 400ms ease-in-out',
  },
}

export const Picture = memo(UIPicture)
