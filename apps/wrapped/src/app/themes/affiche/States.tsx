import type { NoticeProps } from '../types'
import { t } from '../../sheets'
import { Brushed, Sheet } from './Sheet'
import './affiche.css'

export const Loading = () => (
  <main className="wall" aria-busy="true">
    <Sheet className="sheet-loading">
      <svg className="loading-stroke" viewBox="0 0 200 40" aria-hidden="true">
        <path d="M6 28 C 40 6, 70 34, 104 18 S 170 8, 194 22" />
      </svg>
      <p className="visually-hidden">{t('wrapped.loading')}</p>
    </Sheet>
  </main>
)

export const Notice = ({ lines, text, action }: NoticeProps) => (
  <main className="wall">
    <Sheet className="sheet-notice">
      <Brushed as="h1" lines={lines} seed={action ? 15 : 14} />
      <p className="notice">{text}</p>
      {action && <button className="retry" type="button" onClick={action.onClick}>{action.label}</button>}
    </Sheet>
  </main>
)
