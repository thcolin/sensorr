import type { ThemeProps } from '../types'
import type { SheetModel } from '../../sheets'
import { Cover as Front } from './Tele'
import './tele.css'

// The front of the magazine alone, filling the frame Keep in touch opens it in
const Cover = ({ share, sheets, art }: ThemeProps) => (
  <main className="tele-presentation">
    <Front sheet={sheets[0] as Extract<SheetModel, { kind: 'opening' }>} name={share.name} art={art} />
  </main>
)

export default Cover
