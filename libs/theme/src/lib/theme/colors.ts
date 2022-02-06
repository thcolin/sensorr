export const light = {
  text: '#1a1a1a', // Body foreground color
  background: 'hsla(154, 99%, 41%, 1)', // Body background color
  primary: 'hsla(154, 99%, 41%, 1)', // Primary brand color for links, buttons, etc.
  secondary: '#081C24', // A secondary brand color for alternative styling
  accent: 'hsla(154, 97%, 37%, 1)', // A contrast color for emphasizing UI
  highlight: 'hsla(154, 95%, 33%, 1)', // A background color for highlighting text
  dark: 'hsla(154, 93%, 31%, 1)', // A background color for highlighting text
  wrong: '#E32626',
  white: '#FFFFFF',
  muted: '#FBFBFB', // A faint color for backgrounds, borders, and accents that do not require high contrast with the background color
  gray0: '#FBFBFB',
  gray1: '#F6F6F6',
  gray2: '#EEEEEE',
  gray3: '#E4E4E4',
  gray4: '#CCCCCC',
  gray5: '#999999',
  gray6: '#666666',
  black: '#000000',
  shadow: 'hsla(0, 0%, 10%, 0.5)',
  darkShadow: 'hsla(0, 0%, 0%, 0.5)',
  lightShadow: 'hsla(0, 0%, 90%, 0.5)',
  blackShadow: 'hsla(0, 0%, 0%, 0.75)',
  shadowText: '#FFFFFF',
}

export const dark = {
  text: '#e6e6e6', // Body foreground color
  background: 'hsla(154, 99%, 41%, 1)', // Body background color
  primary: 'hsla(154, 99%, 41%, 1)', // Primary brand color for links, buttons, etc.
  secondary: '#081C24', // A secondary brand color for alternative styling
  accent: 'hsla(154, 97%, 37%, 1)', // A contrast color for emphasizing UI
  highlight: 'hsla(154, 95%, 33%, 1)', // A background color for highlighting text
  dark: 'hsla(154, 93%, 31%, 1)', // A background color for highlighting text
  wrong: '#E32626',
  white: '#000000',
  muted: '#1a1a1a', // A faint color for backgrounds, borders, and accents that do not require high contrast with the background color
  gray0: '#050505',
  gray1: '#0a0a0a',
  gray2: '#121212',
  gray3: '#1c1c1c',
  gray4: '#333333',
  gray5: '#666666',
  gray6: '#999999',
  black: '#FFFFFF',
  shadow: 'hsla(0, 0%, 90%, 0.5)',
  darkShadow: 'hsla(0, 0%, 9%, 0.5)',
  lightShadow: 'hsla(0, 0%, 90%, 0.5)',
  blackShadow: 'hsla(0, 0%, 0%, 0.75)',
  shadowText: '#FFFFFF',
}

export const colors = {
  ...light,
  modes: { dark },
}

export const shadows = {
  gray: colors.darkShadow,
  black: colors.blackShadow,
}
