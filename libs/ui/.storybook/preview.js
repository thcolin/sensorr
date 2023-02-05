import { addDecorator } from '@storybook/react'
import { ThemeUIProvider } from 'theme-ui'
import { Router, Route } from 'react-router-dom'
import { createMemoryHistory } from 'history'
import { Global, theme } from '../../theme/src'
import 'tippy.js/dist/tippy.css'
import '../../i18n/src'

const styles = {
  container: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '15em',
  },
}

addDecorator((story) => (
  <Router history={createMemoryHistory({ initialEntries: ['/'] })}>
    <ThemeUIProvider theme={theme}>
      <Global />
      <div style={styles.container}>
        <Route path='/' component={() => story()} />
      </div>
    </ThemeUIProvider>
  </Router>
))

export const parameters = {
  layout: 'centered',
  backgrounds: {
    default: 'white',
    values: [
      {
        name: 'white',
        value: 'white',
      },
      {
        name: 'primary',
        value: theme.rawColors.primary,
      },
      {
        name: 'light',
        value: theme.rawColors.grayLightest,
      },
      {
        name: 'dark',
        value: theme.rawColors.modes.dark.grayLightest,
      },
    ],
  },
}
