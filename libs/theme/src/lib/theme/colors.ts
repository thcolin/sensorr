/**
 * Color naming convention, `color[Variation]` with below variations (`shadow` and `gray-x00` are exceptions),
 * - `color` / `colorLight` / `colorLigther` / `colorLightest`
 * - `color` / `colorDark` / `colorDarker` / `colorDarkest`
 * - `color` / `colorBright` / `colorBrighter` / `colorBrightest`
 * - `color` / `colorPale` / `colorPaler` / `colorPalest`
 * - `color` / `colorNeon` / `colorNeoner` / `colorNeonest`
 * - `color` / `colorPure`
 */

const raw = {
  primary: 'hsla(154, 99%, 41%, 1)',
  primaryDark: 'hsla(154, 97%, 37%, 1)',
  primaryDarker: 'hsla(154, 95%, 33%, 1)',
  primaryDarkest: 'hsla(154, 93%, 31%, 1)',
  accent: 'hsla(154, 97%, 37%, 1)',
  accentDark: 'hsla(154, 95%, 33%, 1)',
  accentDarker: 'hsla(154, 93%, 31%, 1)',
  accentDarkest: 'hsla(154, 90%, 28%, 1)',
  secondaryLight: 'hsla(197, 64%, 19%, 1)',
  secondary: 'hsla(197, 64%, 9%, 1)',
  plex: 'hsla(41, 89%, 47%, 1)',
  success: 'hsla(154, 99%, 41%, 1)',
  successDark: 'hsla(154, 97%, 37%, 1)',
  successDarker: 'hsla(154, 95%, 33%, 1)',
  error: 'hsla(0, 77%, 52%, 1)',
  errorDark: 'hsla(0, 75%, 48%, 1)',
  errorDarker: 'hsla(0, 73%, 43%, 1)',
  warningLightest: 'hsla(45, 100%, 82%, 1)',
  warningLighter: 'hsla(45, 90%, 70%, 1)',
  warningLight: 'hsla(45, 89%, 60%, 1)',
  warning: 'hsla(45, 89%, 47%, 1)',
  warningDark: 'hsla(45, 89%, 40%, 1)',
  warningDarker: 'hsla(45, 89%, 30%, 1)',
  warningDarkest: 'hsla(45, 89%, 21%, 1)',
  whitePure: 'hsla(0, 0%, 100%, 1)',
  white: 'hsla(0, 0%, 100%, 1)',
  whiteDark: 'hsla(0, 0%, 98%, 1)',
  whiteDarker: 'hsla(0, 0%, 96%, 1)',
  whiteDarkest: 'hsla(0, 0%, 93%, 1)',
  'gray-100': 'hsla(0, 0%, 90%, 1)',
  'gray-200': 'hsla(0, 0%, 89%, 1)',
  'gray-300': 'hsla(0, 0%, 80%, 1)',
  'gray-400': 'hsla(0, 0%, 69%, 1)',
  'gray-500': 'hsla(0, 0%, 60%, 1)',
  'gray-600': 'hsla(0, 0%, 40%, 1)',
  'gray-700': 'hsla(0, 0%, 28%, 1)',
  'gray-800': 'hsla(0, 0%, 20%, 1)',
  'gray-900': 'hsla(0, 0%, 10%, 1)',
  blackLightest: 'hsla(0, 0%, 7%, 1)',
  blackLighter: 'hsla(0, 0%, 4%, 1)',
  blackLight: 'hsla(0, 0%, 2%, 1)',
  black: 'hsla(0, 0%, 0%, 1)',
  blackPure: 'hsla(0, 0%, 0%, 1)',
  whiteShadow: 'hsla(0, 0%, 90%, 0.5)',
  grayShadow: 'hsla(0, 0%, 9%, 0.5)',
  blackShadow: 'hsla(0, 0%, 0%, 0.75)',
  textShadow: 'hsla(0, 0%, 100%)',
  shadowDarker: 'hsla(0, 0%, 0%, 0.5)',
  shadowDark: 'hsla(0, 0%, 10%, 0.5)',
  shadowLight: 'hsla(0, 0%, 60%, 0.125)',
  shadowLighter: 'hsla(0, 0%, 90%, 0.5)',
}

export const light = {
  ...raw,

  text: raw['gray-900'],
  background: raw.primary,
  muted: raw['gray-200'],
  hightlight: raw.primaryDarker,
  darken: raw.accentDarkest,

  grayLightest: raw.whiteDark,
  grayLighter: raw.whiteDarker,
  grayLight: raw.whiteDarkest,
  gray: raw['gray-200'],
  grayDark: raw['gray-300'],
  grayDarker: raw['gray-500'],
  grayDarkest: raw['gray-600'],

  shadow: raw.shadowDark,
  shadowTheme: raw.shadowDarker,
}

export const dark = {
  ...raw,

  text: raw['gray-100'],
  background: raw.primary,
  muted: raw['gray-900'],
  hightlight: raw.primaryDarker,
  darken: raw.accentDarkest,

  white: raw.black,
  whiteDark: raw.blackLight,
  whiteDarker: raw.blackLighter,
  whiteDarkest: raw.blackLightest,

  grayLightest: raw.blackLight,
  grayLighter: raw.blackLighter,
  grayLight: raw.blackLightest,
  gray: raw['gray-900'],
  grayDark: raw['gray-800'],
  grayDarker: raw['gray-600'],
  grayDarkest: raw['gray-500'],

  blackLightest: raw.whiteDarkest,
  blackLighter: raw.whiteDarker,
  blackLight: raw.whiteDark,
  black: raw.white,

  shadow: raw.shadowLighter,
  shadowTheme: raw.shadowLight,
}

export const colors = {
  // `light` is default
  ...light,
  modes: { dark },
}

export const shadows = {
  gray: colors.grayShadow,
  black: colors.blackShadow,
}
