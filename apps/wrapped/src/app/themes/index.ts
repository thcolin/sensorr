import { lazy } from 'react'
import type { WrappedTheme } from '@sensorr/sensorr'
import type { ThemeProps } from './types'

type Loader = () => Promise<{ default: React.ComponentType<ThemeProps> }>

// Each look loads with its own fonts and sheet the first time it is shown
export const LOADERS: Record<WrappedTheme, Loader> = {
  affiche: () => import('./affiche/Affiche'),
  labo: () => import('./labo/Labo'),
  tele: () => import('./tele/Tele'),
  videoclub: () => import('./videoclub/Videoclub'),
  scenario: () => import('./scenario/Scenario'),
}

export const THEMES = Object.fromEntries(Object.entries(LOADERS).map(([id, loader]) => [id, lazy(loader)])) as Record<WrappedTheme, React.LazyExoticComponent<React.ComponentType<ThemeProps>>>

// The colour the browser paints around each look, on phones the status bar
export const THEME_COLORS: Record<WrappedTheme, string> = {
  affiche: '#b8955a',
  labo: '#120c08',
  tele: '#f4efe4',
  videoclub: '#0c0a1a',
  scenario: '#2b2622',
}
