import { StrictMode } from 'react'
import { render } from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from 'theme-ui'
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'
import { Global, theme } from '@sensorr/theme'
import { Provider as LoadingProvider } from './contexts/Loading/Loading'
import { Provider as MoviesMetadataProvider } from './contexts/MoviesMetadata/MoviesMetadata'
import { Provider as PersonsMetadataProvider } from './contexts/PersonsMetadata/PersonsMetadata'
import { Provider as SearchProvider } from './contexts/Search/Search'
import { Provider as JobsProvider } from './contexts/Jobs/Jobs'
import { Provider as AnimationProvider } from './contexts/Animation/Animation'
import App from './layout/App/App'
import 'tippy.js/dist/tippy.css'
import './store/i18n'

const cache = createCache()
cache.compat = true

render(
  <StrictMode>
    <BrowserRouter>
      <CacheProvider value={cache as any}>
        <ThemeProvider theme={theme as any}>
          <Global />
          <LoadingProvider>
            <MoviesMetadataProvider>
              <PersonsMetadataProvider>
                <SearchProvider>
                  <JobsProvider>
                    <AnimationProvider>
                      <App />
                    </AnimationProvider>
                  </JobsProvider>
                </SearchProvider>
              </PersonsMetadataProvider>
            </MoviesMetadataProvider>
          </LoadingProvider>
        </ThemeProvider>
      </CacheProvider>
    </BrowserRouter>
  </StrictMode>,
  document.getElementById('root'),
)

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
