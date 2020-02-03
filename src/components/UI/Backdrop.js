import React from 'react'
import Shadow from 'components/UI/Shadow'

const Backdrop = ({ src, ready, palette, onReady, width = 300, fade = 0.05, ...props }) => (
  <div {...props} css={[Backdrop.styles.element, props.css]}>
    <img
      {...(src ? {
        src: src.charAt(0) === '/' ? `https://image.tmdb.org/t/p/w${width}${src}` : src
      } : {})}
      onLoad={onReady}
      onError={onReady}
      css={Backdrop.styles.img}
      style={{
        transition: `opacity 400ms ease-in-out ${ready ? '400ms' : '0ms'}`,
        opacity: src && ready ? 1 : 0,
      }}
    />
    <Shadow palette={palette} fade={fade} />
  </div>
)

Backdrop.styles = {
  element: {
    position: 'absolute',
    height: '100%',
    width: '100%',
  },
  img: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    objectFit: 'cover',
    objectPosition: 'center center',
  },
}

export default Backdrop
