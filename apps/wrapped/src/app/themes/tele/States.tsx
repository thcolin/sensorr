import type { NoticeProps } from '../types'
import './tele.css'

// The card a channel shows between programmes, on a set's screen
export const TestCard = ({ rolling }: { rolling?: boolean }) => (
  <div className={`tele-screen${rolling ? ' tele-screen-rolling' : ''}`} aria-hidden="true">
    <svg className="tele-screen-card" viewBox="0 0 280 160">
    {['paper', 'yellow', 'cyan', 'green', 'magenta', 'red', 'blue'].map((fill, index) => <rect key={fill} x={index * 40} y="0" width="40" height="112" style={{ fill: `var(--${fill})` }} />)}
    {['blue', 'ink', 'magenta', 'ink', 'cyan', 'ink', 'paper'].map((fill, index) => <rect key={index} x={index * 40} y="112" width="40" height="16" style={{ fill: `var(--${fill})` }} />)}
    <rect x="0" y="128" width="280" height="32" style={{ fill: 'var(--ink)' }} />
    <circle cx="140" cy="64" r="44" fill="none" strokeWidth="3" style={{ stroke: 'var(--ink)' }} />
    </svg>
  </div>
)

// The set waits on its test card until the issue arrives
export const Loading = () => (
  <main className="tele-state" aria-busy="true">
    <div className="tele-state-page tele-state-waiting">
      <p className="tele-state-logo" aria-hidden="true">Télé</p>
      <TestCard rolling />
      <p className="visually-hidden">Chargement de la rétrospective</p>
    </div>
  </main>
)

// A page of the weekly announcing the programmes are interrupted
export const Notice = ({ lines, text, action }: NoticeProps) => (
  <main className="tele-state">
    <div className="tele-state-page">
      <p className="tele-folio" aria-hidden="true"><span>Télé</span><b>Interruption des programmes</b><span>p. 1</span></p>
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
