import type { WrappedTheme } from '@sensorr/sensorr'
import { THEMES } from './themes'

// The look chosen by the friend, and the last look shown for a link, kept on the device
const keyOf = { chosen: 'wrapped-look', shown: 'wrapped-shown' }

export const known = (theme: string | null): theme is WrappedTheme => !!theme && Object.hasOwn(THEMES, theme)

export const read = (kind: keyof typeof keyOf, token: string) => {
  try {
    const theme = window.localStorage.getItem(`${keyOf[kind]}:${token}`)
    // A link never opened here, or no link at all, wears the look last shown on this device
    const last = kind === 'shown' ? window.localStorage.getItem(`${keyOf.shown}:last`) : null
    return known(theme) ? theme : known(last) ? last : null
  } catch (error) {
    // Private browsing or blocked storage: nothing is remembered on this device
    return null
  }
}

export const write = (kind: keyof typeof keyOf, token: string, theme: WrappedTheme) => {
  try {
    window.localStorage.setItem(`${keyOf[kind]}:${token}`, theme)
    kind === 'shown' && window.localStorage.setItem(`${keyOf.shown}:last`, theme)
  } catch (error) {
    // Not remembered, the look still shows for this visit
  }
}
