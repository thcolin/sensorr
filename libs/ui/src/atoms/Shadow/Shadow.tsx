import { memo, useMemo } from 'react'
import Color from 'color'
import { Palette } from '@sensorr/palette'

export interface ShadowProps extends React.HTMLAttributes<HTMLDivElement> {
  palette: Palette
  fade: number
}

const UIShadow = ({ palette, fade = 0.3, ...props }) => {
  const styles = useMemo(() => ({
    ...UIShadow.styles,
    element: {
      ...UIShadow.styles.element,
      transition: 'background-color 800ms ease-in-out',
      backgroundColor: Color(palette.backgroundColor).fade(fade).rgb().string(),
    }
  }), [palette?.backgroundColor, fade])

  return (
    <div {...props} sx={styles.element} />
  )
}

UIShadow.styles = {
  element: {
    position: 'absolute',
    height: '100%',
    width: '100%',
  },
}

export const Shadow = memo(UIShadow)
