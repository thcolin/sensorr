import { forwardRef, memo, useMemo } from 'react'
import { Link as RRLink, LinkProps as RRLinkProps } from 'react-router-dom'

export interface LinkProps extends RRLinkProps {
  disabled?: boolean
}

const UILink = forwardRef(({ disabled = false, to, viewTransition = true, ...props }: LinkProps, ref: any) => {
  const style = useMemo(() => ({
    ...(props.style || {}),
    ...(disabled ? { pointerEvents: 'none' } : {}),
  }), [disabled, props.style]) as any

  return (
    <RRLink
      {...(ref ? { ref } : {})}
      sx={{ variant: 'link.reset' }}
      {...props}
      to={to || ''}
      style={style}
      viewTransition={viewTransition}
    />
  )
})

export const Link = memo(UILink)
