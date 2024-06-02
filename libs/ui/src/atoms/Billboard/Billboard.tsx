import { lazy, memo, useMemo } from 'react'
import { Palette } from '@sensorr/palette'
import { Shadow } from '../Shadow/Shadow'
import { Picture, PictureProps } from '../Picture/Picture'

export interface BillboardProps extends React.HTMLAttributes<HTMLDivElement>, Pick<PictureProps, 'size'> {
  path: string
  palette: Palette
  onReady?: () => void
  ready?: boolean
  lazy?: boolean
  blur?: boolean | number
  fade?: number
}

const UIBillboard = ({ path, palette, onReady, ready = true, lazy = true, blur = 2, size = 'w780', fade = 0.05, ...props }: BillboardProps) => (
  <div {...props} sx={UIBillboard.styles.element}>
    <Picture
      path={path}
      size={size}
      ready={ready}
      onReady={onReady}
      lazy={lazy}
      blur={blur}
    />
    <Shadow palette={palette} fade={fade} />
  </div>
)

UIBillboard.styles = {
  element: {
    position: 'relative',
    height: '100%',
    width: '100%',
    '>*:last-child': {
      position: 'absolute',
      top: '0px',
    },
  },
}

export const Billboard = memo(UIBillboard)

