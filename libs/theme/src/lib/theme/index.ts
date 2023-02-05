import { sizes, radii } from './sizes'
import { colors, shadows } from './colors'
import { fontFamilies, fontWeights, lineHeights } from './font'
import { breakpoints } from './breakpoints'
import { borders } from './borders'
import { global } from './global'
import * as variants from './variants'
import './modules.css'

export const theme = {
  config: {
    initialColorModeName: 'light',
    useColorSchemeMediaQuery: false,
  },
  ...variants,
  space: sizes,
  radii,
  borders,
  fonts: fontFamilies,
  fontWeights,
  fontSizes: sizes,
  lineHeights,
  colors,
  shadows,
  breakpoints,
  styles: {
    root: global,
  },
}

export default theme
