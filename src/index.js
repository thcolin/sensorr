import React from 'react'
import { render } from 'react-dom'
import { Provider as ReduxProvider } from 'react-redux'
import { ToastProvider } from 'react-toast-notifications'
import App from 'views/App'
import { Toast, ToastContainer } from 'views/layout/Toasts'
import store from 'store'
import 'styles'

render(
  (
    <ReduxProvider store={store}>
      <ToastProvider components={{ Toast, ToastContainer }}>
        <App />
      </ToastProvider>
    </ReduxProvider>
  ),
  document.querySelector('#mount')
)
