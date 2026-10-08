import { t, type SheetModel } from '../../sheets'
import type { ThemeProps } from '../types'
import { Caps, Clip, Holes, Mark, REVISIONS, figures, lean, scenesOf } from './Scenario'
import './scenario.css'
import { postersOf } from '../posters'

const COLUMNS = 4
// Enough pages in a column to fill the frame twice over, however few the year has
const ROLL = 8
const CONTENTS = 5

// The title page on the desk, the size of the frame Keep in touch opens it in: the revised pages of the year slide by under it
const Cover = ({ share, sheets, art, link }: ThemeProps) => {
  const [opening, ...inside] = sheets
  const sheet = opening as Extract<SheetModel, { kind: 'opening' }>
  const posters = postersOf([sheets, share.wrapped])
  const columns = Array.from({ length: COLUMNS }, (_, column) => Array.from({ length: ROLL }, (_, row) => column * ROLL + row))
  const starts = sheets.reduce<number[]>((all, _, index) => [...all, (all[index - 1] || 1) + (index ? scenesOf(sheets[index - 1]) : 0)], [])

  return (
    <main className="scenario-front">
      <div className="scenario-front-pile" aria-hidden="true">
        {!!posters.length && columns.map((column, index) => (
          <div key={index} className="scenario-front-column">
            {[...column, ...column].map((page, at) => {
              const poster = posters[(index * 3 + (page % ROLL)) % posters.length]
              const src = art(poster, 'thumb', 320)
              return (
                <div key={at} className="scenario-front-sheet" data-revision={REVISIONS[1 + (page % (REVISIONS.length - 1))]} style={{ '--tilt': `${(lean(page) - 0.5) * 3}deg` } as React.CSSProperties}>
                  <Holes />
                  <span className="scenario-front-number">{page + 2}.</span>
                  <figure className="scenario-front-insert" style={{ '--tilt': `${(lean(poster.key) - 0.5) * 6}deg` } as React.CSSProperties}>
                    <Clip />
                    {src ? <img src={src} alt="" decoding="async" /> : <span>{poster.title}</span>}
                  </figure>
                  <Caps>{poster.title}</Caps>
                </div>
              )
            })}
          </div>
        ))}
      </div>
      <section className="scenario-front-title" aria-label={sheet.label}>
        <Holes brads />
        <h1 className="scenario-title">{sheet.title}</h1>
        <p className="scenario-byline">{t('wrapped.scenario.writtenBy')}</p>
        <p className="scenario-author"><Mark><Caps>{sheet.name}</Caps></Mark></p>
        <div className="scenario-front-draft">
          {sheet.lede && <p>{sheet.lede}</p>}
          <ul>
            {sheet.figures.map((figure) => <li key={figure}>{figures(figure)}</li>)}
          </ul>
        </div>
      </section>
      <div className="scenario-front-lines">
        <nav className="scenario-front-contents" aria-labelledby="scenario-front-contents">
          <h2 id="scenario-front-contents">{t('wrapped.scenario.cover.contents')}</h2>
          <ol>
            {inside.slice(0, CONTENTS).map((other, index) => (
              <li key={index}><a href={link?.(index + 1)} target="_blank" rel="noopener noreferrer"><span>{starts[index + 1]}</span> <span>{other.label}</span></a></li>
            ))}
          </ol>
        </nav>
        <a className="scenario-front-read" href={link?.(0)} target="_blank" rel="noopener noreferrer"><span>{t('wrapped.scenario.cover.read')}</span></a>
      </div>
    </main>
  )
}

export default Cover
