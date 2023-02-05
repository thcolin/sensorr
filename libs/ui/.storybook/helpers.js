import { light, dark } from '@sensorr/theme'

export const ColorModeWrapper = ({ value = 'light', color = null, background = null, children, ...props }) => (
  <div
    sx={{
      color: color || { light: light.text, dark: dark.text, primary: 'textShadow' }[value],
      backgroundColor: background || { light: light.grayLightest, dark: dark.grayLightest, primary: 'primary' }[value],
      flex: 1,
      padding: 2,
    }}
  >
    {children}
  </div>
)
