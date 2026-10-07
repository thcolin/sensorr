import type { NoticeProps } from '../types'
import { t } from '../../sheets'
import './tele.css'

// The colour of each bar of the card, then of each block of the strip under them
const BARS = ['paper', 'yellow', 'cyan', 'green', 'magenta', 'red', 'blue']
const STRIP = ['blue', 'ink', 'magenta', 'ink', 'cyan', 'ink', 'paper']

// The card a channel shows between programmes, on a set's screen
export const TestCard = ({ rolling }: { rolling?: boolean }) => (
  <div className={`tele-screen${rolling ? ' tele-screen-rolling' : ''}`} aria-hidden="true">
    <svg className="tele-screen-card" viewBox="0 0 280 160">
    {BARS.map((fill, index) => <rect key={fill} x={index * 40} y="0" width="40" height="112" style={{ fill: `var(--${fill})` }} />)}
    {STRIP.map((fill, index) => <rect key={index} x={index * 40} y="112" width="40" height="16" style={{ fill: `var(--${fill})` }} />)}
    <rect x="0" y="128" width="280" height="32" style={{ fill: 'var(--ink)' }} />
    <circle cx="140" cy="64" r="44" fill="none" strokeWidth="3" style={{ stroke: 'var(--ink)' }} />
    </svg>
  </div>
)

// The set waits on its test card until the issue arrives
export const Loading = () => (
  <main className="tele-state" aria-busy="true">
    <div className="tele-state-page tele-state-waiting">
      <p className="tele-state-logo" aria-hidden="true">{t('wrapped.tele.brand')}</p>
      <TestCard rolling />
      <p className="visually-hidden">{t('wrapped.loading')}</p>
    </div>
  </main>
)

// A page of the weekly announcing the programmes are interrupted
export const Notice = ({ lines, text, action }: NoticeProps) => (
  <main className="tele-state">
    <div className="tele-state-page">
      <p className="tele-folio" aria-hidden="true"><span>{t('wrapped.tele.brand')}</span><b>{t('wrapped.tele.interrupted')}</b><span>{t('wrapped.tele.page', { page: 1 })}</span></p>
      <h1 className="tele-headline">
        {lines.slice(0, -1).join(' ')}{lines.length > 1 && ' '}
        <span className="tele-band">{lines[lines.length - 1]}</span>
      </h1>
      <p className="tele-standfirst">{text}</p>
      {action && <button className="tele-button" type="button" onClick={action.onClick}>{action.label}</button>}
      <TestCard />
    </div>
  </main>
)
