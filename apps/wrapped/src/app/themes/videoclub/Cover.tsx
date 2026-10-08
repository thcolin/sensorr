import { t, type SheetModel } from '../../sheets'
import type { ThemeProps } from '../types'
import { Box, Sign, Spines, figures, tapeOf } from './Videoclub'
import './videoclub.css'
import { postersOf } from '../posters'

const SHELVES = 6
// Enough cases on a shelf to run past the frame twice over, however few the year has
const RUN = 12
const CONTENTS = 5

// The shop at night, the size of the frame Keep in touch opens it in: the year's tapes slide past on the shelves of the aisle behind the sign
const Cover = ({ share, sheets, art, link }: ThemeProps) => {
  const [opening, ...inside] = sheets
  const sheet = opening as Extract<SheetModel, { kind: 'opening' }>
  const posters = postersOf([sheets, share.wrapped])
  const shelves = Array.from({ length: SHELVES }, (_, shelf) => Array.from({ length: RUN }, (_, slot) => posters[(shelf * 5 + slot) % posters.length]))

  return (
    <main className="videoclub-presentation" style={{ '--letters': sheet.name.length } as React.CSSProperties}>
      <div className="videoclub-presentation-aisle" aria-hidden="true">
        {!!posters.length && shelves.map((shelf, index) => (
          <div key={index} className="videoclub-presentation-shelf">
            <div className="videoclub-presentation-run">
              {/* Every fourth tape stands spine out, as on a shelf too full to face them all */}
              {[...shelf, ...shelf].map((poster, at) => at % 4 === 3
                ? <Spines key={at} poster={poster} count={2 + (at % 3)} />
                : <Box key={at} poster={poster} art={art} width={320} tilt={((at * 7) % 5 - 2) * 5} eager />)}
            </div>
          </div>
        ))}
      </div>
      <Sign sheet={sheet} />
      <div className="videoclub-presentation-counter">
        {sheet.lede && <p className="videoclub-lede">{figures(sheet.lede)}</p>}
        <div className="videoclub-presentation-pair">
          <div className="videoclub-ticket videoclub-ticket-receipt">
            <p className="videoclub-ticket-head" aria-hidden="true">{t('wrapped.videoclub.receipt', { year: sheet.year })}</p>
            <ul>
              {sheet.figures.map((figure) => <li key={figure}>{figures(figure)}</li>)}
            </ul>
          </div>
          <div className="videoclub-presentation-releases">
            <p className="videoclub-aisle-tag">{t('wrapped.videoclub.cover.releases')}</p>
            <ol>
              {inside.slice(0, CONTENTS).map((other, index) => (
                <li key={index}>
                  <a href={link?.(index + 1)} target="_blank" rel="noopener noreferrer" style={{ '--tape': tapeOf(other.label) } as React.CSSProperties}>
                    <b>{String(index + 2).padStart(2, '0')}</b> <span>{other.label}</span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <a className="videoclub-button videoclub-presentation-rewind" href={link?.(0)} target="_blank" rel="noopener noreferrer">{t('wrapped.videoclub.cover.rewind')}</a>
      </div>
    </main>
  )
}

export default Cover
