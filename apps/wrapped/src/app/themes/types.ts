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
  // The address of the wrapped opened on a story, from 0; given to a look's cover only
  link?: (index: number) => string
}

// A story is a sheet on its own page, or the summary that closes them and is shared for the whole year
export type StoryModel = SheetModel | { kind: 'summary', label: string }

export interface StoryProps extends ThemeProps {
  story: StoryModel
  // Its place among the stories, from 0
  index: number
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
