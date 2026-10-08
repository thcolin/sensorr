import { Trans } from 'react-i18next'
import { t, type SheetModel } from '../../sheets'
import type { ThemeProps } from '../types'
import { Barcode, Photo, figures, rubric } from './Tele'
import './tele.css'
import { postersOf } from '../posters'

const COLUMNS = 4
// Enough posters in a column to fill the frame twice over, however few the year has
const ROLL = 8
const CONTENTS = 5

// The issue on the newsstand, the size of the frame Keep in touch opens it in: the year's posters roll behind its front
const Cover = ({ share, sheets, art, link }: ThemeProps) => {
  const [opening, ...inside] = sheets
  const sheet = opening as Extract<SheetModel, { kind: 'opening' }>
  const posters = postersOf([sheets, share.wrapped])
  const columns = Array.from({ length: COLUMNS }, (_, column) => Array.from({ length: ROLL }, (_, row) => posters[(column * 3 + row) % posters.length]))
  const [lead] = sheet.figures

  return (
    <main className="tele-presentation">
      <div className="tele-presentation-wall" aria-hidden="true">
        {!!posters.length && columns.map((column, index) => (
          <div key={index} className="tele-presentation-column">
            {[...column, ...column].map((poster, at) => <Photo key={at} poster={poster} art={art} width={320} eager />)}
          </div>
        ))}
      </div>
      <header className="tele-mast" aria-hidden="true">
        <p className="tele-logo" style={{ '--letters': share.name.length + t('wrapped.tele.brand').length } as React.CSSProperties}>{t('wrapped.tele.brand')}<span>{share.name}</span></p>
        <p className="tele-issue"><Trans i18nKey="wrapped.tele.issue" values={{ year: sheet.year }} components={[<b />]} /></p>
      </header>
      <p className="tele-sticker" aria-hidden="true"><span><Trans i18nKey="wrapped.tele.sticker" components={[<b />]} /></span></p>
      <div className="tele-presentation-lines">
        {sheet.lede && <p className="tele-cover-lede">{sheet.lede}</p>}
        <h1 className="tele-cover-title">{sheet.title}</h1>
        {lead && <p className="tele-cover-line tele-cover-line-lead">{figures(lead)}</p>}
        <div className="tele-presentation-contents">
          <p className="tele-headline"><Trans i18nKey="wrapped.tele.contents.title" components={[<span className="tele-band" />]} /></p>
          <ol>
            {inside.slice(0, CONTENTS).map((other, index) => (
              <li key={index}><a href={link?.(index + 1)} target="_blank" rel="noopener noreferrer"><span>{rubric(other)}</span> {other.label}</a></li>
            ))}
          </ol>
        </div>
        <a className="tele-presentation-read" href={link?.(0)} target="_blank" rel="noopener noreferrer">{t('wrapped.tele.read')}</a>
      </div>
      <Barcode />
    </main>
  )
}

export default Cover
