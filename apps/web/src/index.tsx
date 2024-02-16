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
import { Provider as GuestsProvider } from './contexts/Guests/Guests'
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
                      <GuestsProvider>
                        <Toasts />
                        <App />
                      </GuestsProvider>
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

// TODO: Enable it on production
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker
//       .register('/service-worker.js')
//       .then((registration) => {
//         console.log('SW registered: ', registration)
//       })
//       .catch((registrationError) => {
//         console.log('SW registration failed: ', registrationError)
//       })
//   })
// }
