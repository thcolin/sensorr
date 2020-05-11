import 'polyfill'
import React from 'react'
import { render } from 'react-dom'
import { Provider as ReduxProvider } from 'react-redux'
import { ToastProvider } from 'react-toast-notifications'
import { Router } from 'react-router-dom'
import { Toast, ToastContainer } from 'views/layout/Toasts'
import ScrollRestoration from 'views/enhancers/ScrollRestoration'
import App from 'views/App'
import history from 'utils/history'
import store from 'store'
import 'styles'

render(
  (
    <ReduxProvider store={store}>
      <ToastProvider components={{ Toast, ToastContainer }}>
        <Router history={history}>
          <ScrollRestoration>
            <App />
          </ScrollRestoration>
        </Router>
      </ToastProvider>
    </ReduxProvider>
  ),
  document.querySelector('#mount')
)
