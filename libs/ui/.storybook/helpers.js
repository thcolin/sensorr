import { light, dark } from '@sensorr/theme'

export const ColorModeWrapper = ({ value = 'light', color = null, background = null, children, ...props }) => (
  <div
    sx={{
      color: color || { light: light.text, dark: dark.text, primary: 'shadowText' }[value],
      backgroundColor: background || { light: light.gray0, dark: dark.gray0, primary: 'primary' }[value],
      flex: 1,
      padding: 2,
    }}
  >
    {children}
  </div>
)
