import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeUIProvider } from 'theme-ui'
import { theme } from '@sensorr/theme'
import App from './app/App'

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <ThemeUIProvider theme={theme as any}>
      <App />
    </ThemeUIProvider>
  </StrictMode>,
)
