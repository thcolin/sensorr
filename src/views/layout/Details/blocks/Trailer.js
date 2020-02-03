import React, { useState } from 'react'
import ReactPlayer from 'react-player'
import Backdrop from 'components/UI/Backdrop'
import Spinner from 'components/Spinner'
import Play from 'icons/Play'
import Badge from 'components/Badge'
import theme from 'theme'

const Trailer = ({ details, backdrop, ready, palette, onReady, onPlay, ...props }) => {
  const [trailer, setTrailer] = useState('')
  const trailers = ((details || { videos: {} }).videos || { results: [] }).results
    .filter(video => video.site === 'YouTube' && ['Trailer', 'Teaser'].includes(video.type))
    .sort((a, b) => a.type === 'Trailer' ? -1 : 1)

  return (
    <div
      css={Trailer.styles.element}
      style={{
        height: trailer ? '100vh' : '50vh',
        opacity: ready ? 1 : 0,
        transition: `height 400ms ease-in-out, opacity 400ms ease-in-out ${ready ? `400ms` : `0ms`}`,
      }}
    >
      <Backdrop
        src={backdrop}
        ready={ready}
        palette={palette}
        onReady={onReady}
        width="1280"
        fade={0.3}
        hidden={!backdrop}
      />
      {!!trailers.length && (
        <>
          {trailer ? (
            <button
              css={[theme.resets.button, Trailer.styles.trailers]}
              onClick={() => {
                setTrailer('')
                onPlay(false)
              }}
            >
              <Badge emoji="❌" />
            </button>
          ) : (
            <label htmlFor="trailer" css={Trailer.styles.trailers}>
              <select
                id="trailer"
                value={trailer}
                onChange={(e) => {
                  setTrailer(e.target.value)
                  onPlay(true)
                }}
              >
                {trailers.filter((video) => video.type === 'Trailer').length && (
                  <optgroup label="Trailer">
                    {trailers.filter((video) => video.type === 'Trailer').map(video => (
                      <option key={video.key} value={video.key}>{video.name}</option>
                    ))}
                  </optgroup>
                )}
                {trailers.filter((video) => video.type === 'Teaser').length && (
                  <optgroup label="Teaser">
                    {trailers.filter((video) => video.type === 'Teaser').map(video => (
                      <option key={video.key} value={video.key}>{video.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
              <Badge emoji="🎞️" />
            </label>
          )}
          <div css={[Trailer.styles.loading, { position: 'absolute', width: '100%', height: '100%' }]} hidden={!trailer}>
            <Spinner color="white" />
          </div>
          <button
            css={Trailer.styles.play}
            onClick={() => {
              setTrailer(trailers[0].key)
              onPlay(true)
            }}
            style={{ color: palette.color, zIndex: trailer ? 0 : 1 }}
            hidden={trailer}
          >
            <Play />
          </button>
          <ReactPlayer
            url={trailer && `https://www.youtube.com/watch?v=${trailer}`}
            controls={true}
            playing={true}
            height="100%"
            width="100%"
            style={{
              position: 'absolute',
              opacity: trailer ? 1 : 0,
              transition: `opacity 400ms ease-in-out ${trailer ? '500ms' : '0ms'}`,
              zIndex: trailer ? 1 : 0,
            }}
          />
        </>
      )}
    </div>
  )
}

Trailer.styles = {
  element: {
    position: 'relative',
    minHeight: '25em',
    maxHeight: '40vw',
  },
  trailers: {
    position: 'absolute',
    top: '1em',
    right: '1em',
    cursor: 'pointer',
    zIndex: 2,
    '>select': {
      position: 'absolute',
      opacity: 0,
      top: 0,
      left: 0,
      height: '100%',
      width: '100%',
      appearance: 'none',
      border: 'none',
      cursor: 'pointer',
    },
  },
  loading: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  play: {
    ...theme.resets.button,
    position: 'absolute',
    height: '100%',
    width: '100%',
    transition: 'color 400ms ease-in-out',
    '>svg': {
      height: '3em',
      width: '3em',
    },
  },
}

export default Trailer
