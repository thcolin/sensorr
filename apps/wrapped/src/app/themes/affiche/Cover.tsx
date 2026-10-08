import { t, type SheetModel } from '../../sheets'
import type { ThemeProps } from '../types'
import { figures } from './Affiche'
import { Lettering, lean } from './Sheet'
import './affiche.css'
import { postersOf } from '../posters'

const BANDS = 5
// Enough posters on a band to run past the frame twice over, however few the year has
const RUN = 10
const CONTENTS = 5

// The hoarding, the size of the frame Keep in touch opens it in: the year's posters, inked in violet, slide past in bands behind the fresh one pasted over them
const Cover = ({ share, sheets, art, link }: ThemeProps) => {
  const [opening, ...inside] = sheets
  const sheet = opening as Extract<SheetModel, { kind: 'opening' }>
  const posters = postersOf([sheets, share.wrapped])
  const bands = Array.from({ length: BANDS }, (_, band) => Array.from({ length: RUN }, (_, slot) => posters[(band * 3 + slot) % posters.length]))

  return (
    <main className="affiche-cover">
      <div className="affiche-cover-hoarding" aria-hidden="true">
        {!!posters.length && bands.map((band, index) => (
          <div key={index} className="affiche-cover-band">
            <div className="affiche-cover-run">
              {[...band, ...band].map((poster, at) => (
                <img key={at} src={art(poster, 'thumb', 320)} alt="" style={{ '--lean': `${(lean(at % RUN, index + 30) - 0.5) * 6}deg` } as React.CSSProperties} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="affiche-cover-sheet">
        <Lettering as="h1" className="affiche-cover-title" text={sheet.title} highlight={sheet.name} />
        {sheet.lede && <p className="affiche-cover-lede">{sheet.lede}</p>}
        <div className="affiche-cover-columns">
          <ul className="affiche-cover-figures">
            {sheet.figures.map((figure) => <li key={figure}>{figures(figure)}</li>)}
          </ul>
          <nav className="affiche-cover-bill" aria-labelledby="affiche-cover-bill">
            <h2 id="affiche-cover-bill">{t('wrapped.affiche.bill')}</h2>
            <ol>
              {inside.slice(0, CONTENTS).map((other, index) => (
                <li key={index}><a href={link?.(index + 1)} target="_blank" rel="noopener noreferrer"><b>{String(index + 2).padStart(2, '0')}</b> <span>{other.label}</span></a></li>
              ))}
            </ol>
          </nav>
        </div>
        <a className="affiche-cover-paste" href={link?.(0)} target="_blank" rel="noopener noreferrer"><span>{t('wrapped.affiche.paste')}</span></a>
      </div>
    </main>
  )
}

export default Cover
