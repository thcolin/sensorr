import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeUIProvider } from 'theme-ui'
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'
import { theme } from '@sensorr/theme'
import { Provider as LoadingProvider } from './contexts/Loading/Loading'
import { Provider as AuthProvider } from './contexts/Auth/Auth'
import { Provider as ConfigProvider } from './contexts/Config/Config'
import { Provider as MoviesMetadataProvider } from './contexts/MoviesMetadata/MoviesMetadata'
import { Provider as PersonsMetadataProvider } from './contexts/PersonsMetadata/PersonsMetadata'
import { Provider as SearchProvider } from './contexts/Search/Search'
import { Provider as JobsProvider } from './contexts/Jobs/Jobs'
import { Provider as NotificationsProvider } from './contexts/Notifications/Notifications'
import { Provider as GuestsProvider } from './contexts/Guests/Guests'
import { Provider as DeviceProvider } from './contexts/Device/Device'
import { Toasts } from './contexts/Toasts/Toasts'
import App from './pages/App'
import 'tippy.js/dist/tippy.css'
import './store/i18n'

const cache = createCache({ key: 'sensorr' })
cache.compat = true

const container = document.getElementById('root')
const root = createRoot(container)

root.render(
  <StrictMode>
    <CacheProvider value={cache as any}>
      <ThemeUIProvider theme={theme as any}>
        <LoadingProvider>
          <AuthProvider>
            <ConfigProvider>
              <MoviesMetadataProvider>
                <PersonsMetadataProvider>
                  <SearchProvider>
                    <JobsProvider>
                      <NotificationsProvider>
                        <GuestsProvider>
                          <DeviceProvider>
                            <Toasts />
                            <App />
                          </DeviceProvider>
                        </GuestsProvider>
                      </NotificationsProvider>
                    </JobsProvider>
                  </SearchProvider>
                </PersonsMetadataProvider>
              </MoviesMetadataProvider>
            </ConfigProvider>
          </AuthProvider>
        </LoadingProvider>
      </ThemeUIProvider>
    </CacheProvider>
  </StrictMode>
)

if (process.env['NODE_ENV'] === 'production' && ('serviceWorker' in navigator)) {
  navigator.serviceWorker.register('/service-worker.js')
    .then((registration) => console.log('ServiceWorker registered: ', registration))
    .catch((err) => console.log('ServiceWorker registration failed: ', err))
}
