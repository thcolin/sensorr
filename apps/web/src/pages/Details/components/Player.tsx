import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@sensorr/ui'
import { useTMDB } from '../../../store/tmdb'
import { useExpandContext } from '../contexts/Expand'

const UIPlayer = ({ entity, ready, ...props }) => {
  const tmdb = useTMDB()

  const node = useRef(null)
  const player = useRef(null)

  const { expanded, setExpanded } = useExpandContext() as any

  const [sdkReady, setSDKReady] = useState(false)
  const [playerReady, setPlayerReady] = useState(false)
  const [playlistReady, setPlaylistReady] = useState(false)

  const [fallback, setFallback] = useState(null)
  const playlist = useMemo(() => ([...(entity.videos?.results || []), ...(fallback || [])]
    .filter((video) => video.site === 'YouTube' && ['Trailer', 'Teaser'].includes(video.type))
  ), [entity.id, fallback])

  useEffect(() => {
    if ((window as any).YT?.Player) {
      setSDKReady(true)
    } else {
      (window as any).onYouTubeIframeAPIReady = () => setSDKReady(true)
    }

    return () => (window as any).onYouTubeIframeAPIReady = null
  }, [])

  useEffect(() => {
    if (!sdkReady) {
      return
    }

    player.current = new (window as any).YT.Player(node.current, {
      width: '100%',
      height: '100%',
      listType: 'playlist',
      playerVars: {
        autoplay: 0,
        controls: 1,
        showinfo: 0,
        rel: 0,
        // loop: 0,
        cc_load_policy: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        autohide: 0,
      },
      events: {
        onReady: () => setPlayerReady(true),
      },
    })
  }, [sdkReady])

  useEffect(() => {
    if (!entity.id || !entity.title || tmdb.region === 'en-US') {
      return
    }

    const controller = new AbortController()

    const cb = async () => {
      try {
        setFallback(null)
        setPlaylistReady(false)
        const fallback = await tmdb.fetch(`movie/${entity.id}/videos`, { language: 'en-US' }, { signal: controller.signal })
        setFallback(fallback.results)
      } catch (e) {
        setFallback([])
        console.warn(e)
      }
    }

    cb()
    return () => controller.abort()
  }, [entity.id])

  useEffect(() => {
    if (!playerReady || !fallback || !playlist.length) {
      return
    }

    const cb = async () => {
      const available = []

      for (const video of playlist) {
        try {
          await new Promise((resolve, reject) => {
            player.current.addEventListener('onError', () => reject())
            player.current.addEventListener('onStateChange', (e) => {
              if (e.data == 5) {
                resolve(e.data)
              }
            })

            player.current.cueVideoById(video.key)
          })

          available.push(video.key)
        } catch (e) {}
      }

      player.current.cuePlaylist({ listType: 'playlist', playlist: available.join(',') })
      setPlaylistReady(true)
    }

    cb()
  }, [playerReady, fallback])

  useEffect(() => {
    if (!expanded && player.current) {
      setTimeout(() => player.current.stopVideo(), 600)
    }
  }, [expanded])

  return (
    <div sx={UIPlayer.styles.element} style={{ opacity: ready ? 1 : 0, transition: `opacity 400ms ease-in-out ${ready ? '800ms' : '0ms'}` }}>
      <div
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          height: '100%',
          width: '100%',
          opacity: expanded ? 1 : 0,
          transition: `opacity 400ms ease-in-out ${expanded ? '400ms' : '0ms'}`,
          '>div': {
            height: '100%',
            width: '100%',
            '>div': {
              height: '100%',
              width: '100%',
            },
          },
        }}
      >
        <div ref={node}></div>
      </div>
      <button
        disabled={!playlistReady || !ready}
        onClick={() => {
          setExpanded(true)
          setTimeout(() => player.current.playVideo(), 600)
        }}
        sx={{
          variant: 'button.reset',
          position: 'absolute',
          height: '100%',
          width: '100%',
          '>svg': {
            height: '2rem',
            width: '2rem',
          },
          opacity: ready && !expanded && !!playlist.length ? 1 : 0,
          visibility: expanded || !ready || !playlist.length ? 'hidden' : 'visible',
          transition: `
            opacity 400ms ease-in-out ${ready && !expanded ? '800ms' : '0ms'},
            visibility 0ms ease ${expanded ? '800ms' : '0ms'}
          `,
        }}
      >
        <Icon value={playlistReady ? 'play' : 'spinner'} />
      </button>
    </div>
  )
}

UIPlayer.styles = {
  element: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
    transition: 'opacity 400ms ease-in-out 400ms',
  },
}

export const Player = memo(UIPlayer)
