import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Youtube from 'react-youtube'
import { Icon } from '@sensorr/ui'
import tmdb from '../../../store/tmdb'
import { useExpandContext } from '../contexts/Expand'

const UIPlayer = ({ entity, ready, ...props }) => {
  const target = useRef(null)
  const { expanded, setExpanded } = useExpandContext() as any
  const [loading, setLoading] = useState(true)
  const [paused, setPaused] = useState(false)
  const [fallback, setFallback] = useState(null)
  const [blacklist, setBlacklist] = useState([])
  const playlist = useMemo(() => ([...(entity.videos?.results || []), ...(fallback || [])]
    .filter((video) => video.site === 'YouTube' && ['Trailer', 'Teaser'].includes(video.type) && !blacklist.includes(video.key))
  ), [entity.id, fallback, blacklist])

  const reset = useCallback(() => {
    if (!target.current?.i || !playlist.length) {
      return
    }

    target.current.stopVideo()
    target.current.cuePlaylist({ listType: 'playlist', playlist: playlist.map((video) => video.key).join(',') })

    const timeout = setTimeout(() => setBlacklist(blacklist => [...blacklist, playlist[0].key]), 5000)
    const onPlayerStateChange = ({ data }) => {
      if (data === 5) {
        clearTimeout(timeout)
        target.current.removeEventListener('onStateChange', onPlayerStateChange)
      }
    }

    target.current.addEventListener('onStateChange', onPlayerStateChange)
  }, [playlist])

  const youtube = useMemo(
    () => ({
      opts: {
        height: '100%',
        width: '100%',
        playerVars: {
          autoplay: 0,
          controls: 1,
          showinfo: 0,
          rel: 0,
          iv_load_policy: 3,
          modestbranding: 1,
        } as any,
      },
      onReady: (e) => {
        target.current = e.target
        reset()
      },
      onError: (e) => {
        const index = e.target.getPlaylistIndex()
        const key = (e.target.getPlaylist() || [])[index]
        setBlacklist(blacklist => [...blacklist, key])
        setTimeout(() => {
          e.target.stopVideo()
          e.target.playVideo()
        }, 600)
        target.current = e.target
      },
      onStateChange: ({ data }) => {
        switch (data) {
          case 1: // playing
            setPaused(false)
            setExpanded(true)
            return
          case 2: // paused
            setPaused(true)
            setExpanded(true)
            return
          case 5: // cued
            setLoading(false)
            setPaused(false)
            return
        }
      },
    }),
    [reset],
  )

  useEffect(() => {
    if (!entity.id || !entity.title || tmdb.region === 'en-US') {
      return
    }

    const controller = new AbortController()

    const cb = async () => {
      try {
        setBlacklist([])
        setFallback(null)
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
    if (!entity.videos?.results?.length && !fallback?.length) {
      return
    }

    reset()
  }, [reset])

  useEffect(() => {
    if (!expanded && target.current) {
      setTimeout(() => target.current.stopVideo(), 600)
    }
  }, [expanded])

  if (fallback === null || (!playlist.length)) {
    return null
  }

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
        <Youtube {...youtube} />
      </div>
      <button
        disabled={loading || !ready}
        onClick={() => {
          setExpanded(true)
          setTimeout(() => target.current.playVideo(), 600)
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
          opacity: ready && !expanded ? 1 : 0,
          visibility: expanded || !ready ? 'hidden' : 'visible',
          transition: `
            opacity 400ms ease-in-out ${ready && !expanded ? '800ms' : '0ms'},
            visibility 0ms ease ${expanded ? '800ms' : '0ms'}
          `,
        }}
      >
        <Icon value={!loading ? 'play' : 'spinner'} />
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
