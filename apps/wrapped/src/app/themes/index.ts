import { lazy } from 'react'
import type { WrappedTheme } from '@sensorr/sensorr'

// Each look loads with its own fonts and sheet the first time it is shown
export const THEMES: Record<WrappedTheme, React.LazyExoticComponent<React.ComponentType<import('./types').ThemeProps>>> = {
  affiche: lazy(() => import('./affiche/Affiche')),
  labo: lazy(() => import('./labo/Labo')),
  tele: lazy(() => import('./tele/Tele')),
  videoclub: lazy(() => import('./videoclub/Videoclub')),
  scenario: lazy(() => import('./scenario/Scenario')),
}

// The colour the browser paints around each look, on phones the status bar
export const THEME_COLORS: Record<WrappedTheme, string> = {
  affiche: '#b8955a',
  labo: '#120c08',
  tele: '#f4efe4',
  videoclub: '#0c0a1a',
  scenario: '#2b2622',
}
