import React from 'react'
import { render } from 'react-dom'
import { ToastProvider } from 'react-toast-notifications'
import App from 'views/App'
import { Toast, ToastContainer } from 'views/layout/Toasts'
import 'styles'

render(
  (
    <ToastProvider components={{ Toast, ToastContainer }}>
      <App />
    </ToastProvider>
  ),
  document.querySelector('#mount')
)
