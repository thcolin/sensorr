import {} from 'react'
import { ThemeUICSSObject } from 'theme-ui'

declare module 'react' {
  interface Attributes {
    sx?: any // ThemeUICSSObject
  }
}
