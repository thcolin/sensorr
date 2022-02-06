import { sizes, radii } from './sizes'
import { colors, shadows } from './colors'
import { fontFamilies, fontWeights, lineHeights } from './font'
import { breakpoints } from './breakpoints'
import { borders } from './borders'
import { global } from './global'
import * as variants from './variants'

export const theme = {
  ...variants,
  useColorSchemeMediaQuery: true,
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
  global,
}

export default theme
