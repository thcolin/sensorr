import { addDecorator } from '@storybook/react'
import { ThemeProvider } from 'theme-ui'
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
    <ThemeProvider theme={theme}>
      <Global />
      <div style={styles.container}>
        <Route path='/' component={() => story()} />
      </div>
    </ThemeProvider>
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
        value: theme.rawColors.gray0,
      },
      {
        name: 'dark',
        value: theme.rawColors.modes.dark.gray0,
      },
    ],
  },
}
