import 'polyfill'
import React from 'react'
import { render } from 'react-dom'
import { Provider as ReduxProvider } from 'react-redux'
import { ToastProvider } from 'react-toast-notifications'
import { BrowserRouter as RouterProvider } from 'react-router-dom'
import { Toast, ToastContainer } from 'views/layout/Toasts'
import ScrollToTop from 'views/enhancers/ScrollToTop'
import App from 'views/App'
import store from 'store'
import 'styles'

render(
  (
    <ReduxProvider store={store}>
      <ToastProvider components={{ Toast, ToastContainer }}>
        <RouterProvider>
          <ScrollToTop>
            <App />
          </ScrollToTop>
        </RouterProvider>
      </ToastProvider>
    </ReduxProvider>
  ),
  document.querySelector('#mount')
)
