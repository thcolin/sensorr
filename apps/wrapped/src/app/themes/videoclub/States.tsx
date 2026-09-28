import type { NoticeProps } from '../types'
import './videoclub.css'

// The fascia over the door, the same box as on the opening sheet
const Fascia = () => (
  <span className="videoclub-fascia" aria-hidden="true">
    <span className="videoclub-fascia-face">Vidéoclub</span>
  </span>
)

// Before opening: the tube behind the fascia keeps trying to catch
export const Loading = () => (
  <main className="videoclub videoclub-state videoclub-waiting" aria-busy="true">
    <Fascia />
    <p className="visually-hidden">Chargement de la rétrospective</p>
  </main>
)

// Closed: the shutter down, a note taped on it
export const Notice = ({ lines, text, action }: NoticeProps) => (
  <main className="videoclub videoclub-state videoclub-closed">
    <div className="videoclub-closed-front">
      <Fascia />
    </div>
    <div className="videoclub-closed-shutter">
      <div className="videoclub-note">
        <h1>{lines.map((line) => <span key={line}>{line}</span>)}</h1>
        <p>{text}</p>
        {action && <button className="videoclub-button" type="button" onClick={action.onClick}>{action.label}</button>}
      </div>
    </div>
  </main>
)
