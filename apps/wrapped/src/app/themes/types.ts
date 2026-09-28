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
