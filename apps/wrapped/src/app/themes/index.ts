import { lazy } from 'react'
import type { WrappedTheme } from '@sensorr/sensorr'
import type { StatesModule, StoryProps, ThemeProps } from './types'

type Loader = () => Promise<{ default: React.ComponentType<ThemeProps> }>

// The look a page falls back on when the API cannot say, the default one of the config
export const DEFAULT_THEME: WrappedTheme = 'tele'

// Each look loads with its own fonts and sheet the first time it is shown
export const LOADERS: Record<WrappedTheme, Loader> = {
  tele: () => import('./tele/Tele'),
  labo: () => import('./labo/Labo'),
  videoclub: () => import('./videoclub/Videoclub'),
  scenario: () => import('./scenario/Scenario'),
  affiche: () => import('./affiche/Affiche'),
}

// Each look's loading and notice screens, small enough to show before the share arrives
export const STATES: Record<WrappedTheme, () => Promise<StatesModule>> = {
  tele: () => import('./tele/States'),
  labo: () => import('./labo/States'),
  videoclub: () => import('./videoclub/States'),
  scenario: () => import('./scenario/States'),
  affiche: () => import('./affiche/States'),
}

// The looks drawn as stories on a phone; any other keeps its scrolling page there
export const STORY_LOADERS: Partial<Record<WrappedTheme, () => Promise<{ default: React.ComponentType<StoryProps> }>>> = {
  tele: () => import('./tele/Story'),
  labo: () => import('./labo/Story'),
  videoclub: () => import('./videoclub/Story'),
  scenario: () => import('./scenario/Story'),
  affiche: () => import('./affiche/Story'),
}

export const STORIES = Object.fromEntries(Object.entries(STORY_LOADERS).map(([id, loader]) => [id, lazy(loader)])) as Partial<Record<WrappedTheme, React.LazyExoticComponent<React.ComponentType<StoryProps>>>>

export const THEMES = Object.fromEntries(Object.entries(LOADERS).map(([id, loader]) => [id, lazy(loader)])) as Record<WrappedTheme, React.LazyExoticComponent<React.ComponentType<ThemeProps>>>

// A look's opening on its own, the size of the frame it is shown in: `?cover`, opened by Keep in touch
export const COVERS: Partial<Record<WrappedTheme, React.LazyExoticComponent<React.ComponentType<ThemeProps>>>> = {
  tele: lazy(() => import('./tele/Cover')),
}

// The colour the browser paints around each look, on phones the status bar
export const THEME_COLORS: Record<WrappedTheme, string> = {
  tele: '#f4efe4',
  labo: '#120c08',
  videoclub: '#0c0a1a',
  scenario: '#2b2622',
  affiche: '#b8955a',
}
