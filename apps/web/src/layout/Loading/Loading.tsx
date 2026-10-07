import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { animations } from '@sensorr/theme'
import { LoadingBar } from '../LoadingBar'

const Loading = () => {
  const { t } = useTranslation()

  return (
    <div sx={Loading.styles.element}>
      <LoadingBar />
      <div sx={Loading.styles.wrapper}>
        <div sx={Loading.styles.logo}>
          <span>🍿📼</span>
          <h2>{t('settings.footer.name')}</h2>
          <small>{t('settings.footer.tagline')}</small>
          <p>⌛</p>
        </div>
      </div>
    </div>
  )
}

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
