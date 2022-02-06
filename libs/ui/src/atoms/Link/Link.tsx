import { memo, useMemo } from 'react'
import { Link as RRLink, LinkProps as RRLinkProps } from 'react-router-dom'

export interface LinkProps extends RRLinkProps {
  disabled?: boolean
}

const UILink = ({ disabled = false, to, ...props }: LinkProps) => {
  const style = useMemo(() => ({
    ...(props.style || {}),
    ...(disabled ? { pointerEvents: 'none' } : {}),
  }), [disabled, props.style]) as any

  return (
    <RRLink sx={UILink.styles.element} {...props} to={to || ''} style={style} />
  )
}

UILink.styles = {
  element: {
    variant: 'link.reset',
  },
}

export const Link = memo(UILink)
