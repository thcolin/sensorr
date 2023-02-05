import { memo } from 'react'
import { animations } from '@sensorr/theme'
import { LoadingBar } from '../LoadingBar'

const Loading = () => (
  <div sx={Loading.styles.element}>
    <LoadingBar />
    <div sx={Loading.styles.wrapper}>
      <div sx={Loading.styles.logo}>
        <span>🍿📼</span>
        <h2>sensorr</h2>
        <small>Your Friendly Digital Video Recorder</small>
        <p>⌛</p>
      </div>
    </div>
  </div>
)

Loading.styles = {
  element: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'grayLightest',
  },
  wrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    '>span': {
      fontSize: '4rem',
    },
    '>h2': {
      margin: '0.5rem 0',
      color: 'text',
      fontFamily: 'heading',
      fontSize: '3rem',
      fontWeight: 'bold',
      lineHeight: 'heading',
    },
    '>small': {
      color: 'grayDark',
    },
    '>p': {
      fontSize: 0,
      margin: '4rem 0 0 0',
      animation: `${animations.spin} 2s infinite`,
      lineHeight: 'normal',
    },
  },
}

export default memo(Loading)
