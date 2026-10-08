import type { WrappedTheme } from './wrapped'

export interface WrappedLook {
  ground: string
  ink: string
  label: string
  // `file` is served by the wrapped app, under `/wrapped/assets/fonts/`
  display: { family: string, weight: number, italic: boolean, color: string, file: string }
  // The band of colours along an edge; the labo look draws film perforations instead
  stripe: string[] | null
  button: { background: string, color: string }
}

// Each look outside its own page, in the wrapped mail and on Keep in touch; the colours come from `apps/wrapped/src/app/themes/<look>/<look>.css`
export const WRAPPED_LOOKS: Record<WrappedTheme, WrappedLook> = {
  tele: {
    ground: '#f4efe4',
    ink: '#16140f',
    label: '#5c564a',
    display: { family: "'Barlow Condensed','Arial Narrow',Arial,sans-serif", weight: 800, italic: true, color: '#d1312b', file: 'tele/BarlowCondensed-800-italic.woff2' },
    stripe: ['#f4efe4', '#f8d44a', '#63b7c9', '#5aa457', '#b14e9e', '#d1312b', '#2135a3'],
    button: { background: '#d1312b', color: '#ffffff' },
  },
  labo: {
    ground: '#2a1c12',
    ink: '#eadcc3',
    label: '#ff4b1f',
    display: { family: "'Big Shoulders Display','Arial Narrow',Arial,sans-serif", weight: 900, italic: false, color: '#ffb238', file: 'labo/BigShouldersDisplay-900.woff2' },
    stripe: null,
    button: { background: '#ffb238', color: '#120c08' },
  },
  videoclub: {
    ground: '#221a3d',
    ink: '#efeaff',
    label: '#3ef2ff',
    display: { family: "'Tilt Neon','Trebuchet MS',sans-serif", weight: 400, italic: false, color: '#ff3fa4', file: 'videoclub/TiltNeon.woff2' },
    stripe: ['#ff3fa4', '#3ef2ff', '#ff3fa4'],
    button: { background: '#ff3fa4', color: '#0c0a1a' },
  },
  scenario: {
    ground: '#fbfaf5',
    ink: '#1b1a17',
    label: '#a3201a',
    display: { family: "'Courier Prime','Courier New',monospace", weight: 700, italic: false, color: '#1b1a17', file: 'scenario/CourierPrime-700.woff2' },
    stripe: null,
    button: { background: '#1b1a17', color: '#fbfaf5' },
  },
  affiche: {
    ground: '#b8955a',
    ink: '#241a2e',
    label: '#241a2e',
    display: { family: "'Permanent Marker',Impact,'Arial Black',sans-serif", weight: 400, italic: false, color: '#241a2e', file: 'labo/PermanentMarker-400.woff2' },
    stripe: ['#5c4668', '#b3221a', '#5c4668'],
    button: { background: '#b3221a', color: '#e9dcc0' },
  },
}
