import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeUIProvider } from 'theme-ui'
import { theme } from '@sensorr/theme'
import App from './app/App'

// Clicks to the repository, counted by Umami without holding back the navigation
document.addEventListener('click', (e) => {
  const link = (e.target as Element).closest<HTMLElement>('[data-track]')
  if (link) (window as any).umami?.track(link.dataset.track)
})

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <ThemeUIProvider theme={theme as any}>
      <App />
    </ThemeUIProvider>
  </StrictMode>,
)
