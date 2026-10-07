import type { NoticeProps } from '../types'
import { t } from '../../sheets'
import { Edges, Scorch } from './Labo'
import './labo.css'

// The leader turns while the reel is threaded, without a count that would pretend to know how long
export const Loading = () => (
  <main className="labo-reel" aria-busy="true">
    <section className="labo-sheet labo-sheet-waiting">
      <Edges index={0} />
      <div className="labo-leader labo-leader-waiting" aria-hidden="true">
        <svg className="labo-leader-dial" viewBox="0 0 400 300">
          <line x1="200" y1="0" x2="200" y2="300" />
          <line x1="0" y1="150" x2="400" y2="150" />
          <circle cx="200" cy="150" r="118" />
          <circle cx="200" cy="150" r="100" />
          <path className="labo-leader-sweep" d="M200 150 L200 32 A118 118 0 0 1 318 150 Z" />
        </svg>
      </div>
      <p className="visually-hidden">{t('wrapped.loading')}</p>
    </section>
  </main>
)

// A retry means the film broke and burnt; without one the frame is struck out for good
export const Notice = ({ lines, text, action }: NoticeProps) => (
  <main className="labo-reel">
    <section className="labo-sheet labo-sheet-notice">
      <Edges index={0} />
      <h1 className="labo-title">
        {lines.map((line, index) => <span key={index}>{index > 0 && ' '}{line}</span>)}
      </h1>
      {action ? (
        <div className="labo-burn labo-notice-frame" aria-hidden="true"><Scorch /></div>
      ) : (
        <div className="labo-notice-frame labo-notice-struck" aria-hidden="true">
          <svg className="labo-ring" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M6 8 C 30 34, 62 64, 95 93 M 93 6 C 66 36, 36 62, 5 94" />
          </svg>
        </div>
      )}
      <p className="labo-body">{text}</p>
      {action && <button className="labo-button" type="button" onClick={action.onClick}>{action.label}</button>}
    </section>
  </main>
)
