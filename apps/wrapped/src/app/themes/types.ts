import type { WrappedPoster } from '@sensorr/sensorr'
import type { Share } from '../App'
import type { Colophon, SheetModel } from '../sheets'

export type Art = (item: WrappedPoster, kind?: 'thumb' | 'art', width?: number) => string | undefined

// Every look draws the same sheets, in the same order, with the same words
export interface ThemeProps {
  share: Share
  sheets: SheetModel[]
  colophon: Colophon
  closed: boolean
  art: Art
}

// What a look shows before the share arrives, or instead of it
export interface NoticeProps {
  lines: string[]
  text: string
  action?: { label: string, onClick: () => void }
}

export interface StatesModule {
  Loading: () => JSX.Element
  Notice: (props: NoticeProps) => JSX.Element
}
