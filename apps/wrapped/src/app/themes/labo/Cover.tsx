import { t, type SheetModel } from '../../sheets'
import type { ThemeProps } from '../types'
import { Frame, figures, two } from './Labo'
import { Leader } from './Story'
import './labo.css'
import { postersOf } from '../posters'

const STRIPS = 4
// Enough frames on a strip to fill the frame twice over, however few the year has
const ROLL = 8
const CONTENTS = 5

// The year's reel on the light table, the size of the frame Keep in touch opens it in: its strips run through behind the leader
const Cover = ({ share, sheets, art, link }: ThemeProps) => {
  const [opening, ...inside] = sheets
  const sheet = opening as Extract<SheetModel, { kind: 'opening' }>
  const posters = postersOf([sheets, share.wrapped])
  const strips = Array.from({ length: STRIPS }, (_, strip) => Array.from({ length: ROLL }, (_, row) => posters[(strip * 3 + row) % posters.length]))

  return (
    <main className="labo-cover">
      <div className="labo-cover-table" aria-hidden="true">
        {!!posters.length && strips.map((strip, index) => (
          <div key={index} className="labo-cover-strip">
            {[...strip, ...strip].map((poster, at) => <Frame key={at} poster={poster} art={art} width={320} code={`${index * ROLL + (at % ROLL) + 1}A`} eager />)}
          </div>
        ))}
      </div>
      <Leader sheet={sheet} />
      <div className="labo-cover-lines">
        {sheet.lede && <p className="labo-lede">{sheet.lede}</p>}
        <ul className="labo-slate">
          {sheet.figures.map((figure) => <li key={figure}>{figures(figure)}</li>)}
        </ul>
        <nav className="labo-cover-contents" aria-labelledby="labo-cover-contents">
          <h2 id="labo-cover-contents" className="labo-intro">{t('wrapped.labo.contents')}</h2>
          <ol>
            {inside.slice(0, CONTENTS).map((other, index) => (
              <li key={index}><a href={link?.(index + 1)} target="_blank" rel="noopener noreferrer"><span>{two((index + 1) * 4 + 1)}</span> {other.label}</a></li>
            ))}
          </ol>
        </nav>
        <a className="labo-cover-develop" href={link?.(0)} target="_blank" rel="noopener noreferrer">{t('wrapped.labo.develop')}</a>
      </div>
    </main>
  )
}

export default Cover
