import type { NoticeProps } from '../types'
import './scenario.css'

const Holes = () => (
  <span className="scenario-holes scenario-holes-brads" aria-hidden="true">
    <i /><i /><i />
  </span>
)

// A blank title page, the caret waiting where the title will be typed
export const Loading = () => (
  <div className="scenario-desk scenario-state" aria-busy="true">
    <main className="scenario-script">
      <section className="scenario-page scenario-title-page" data-revision="white">
        <Holes />
        <div className="scenario-title-block">
          <p className="scenario-title scenario-title-blank" aria-hidden="true">{'​'}<span className="scenario-caret" /></p>
        </div>
        <p className="visually-hidden">Chargement de la rétrospective</p>
      </section>
    </main>
  </div>
)

// A single page: the lines typed as its title, the text as an action, the retry where a transition goes
export const Notice = ({ lines, text, action }: NoticeProps) => (
  <div className="scenario-desk scenario-state">
    <main className="scenario-script">
      <section className="scenario-page scenario-title-page scenario-notice" data-revision="pink">
        <Holes />
        <div className="scenario-title-block">
          <h1 className="scenario-title">{lines.join(' ')}</h1>
        </div>
        <p className="scenario-action scenario-notice-text">{text}</p>
        {action
          ? <button className="scenario-retry" type="button" onClick={action.onClick}>{action.label}{' '}:</button>
          : <p className="scenario-transition" aria-hidden="true">Fondu au noir.</p>}
      </section>
    </main>
  </div>
)
