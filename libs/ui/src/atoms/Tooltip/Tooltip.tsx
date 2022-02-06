import { memo } from 'react'

export interface TooltipProps {
  title?: string;
  subtitle?: string
}

export const UITooltip = ({ title, subtitle }: TooltipProps) => (
  <small sx={UITooltip.styles.element}>
    {!!title && <span sx={UITooltip.styles.title}>{title}</span>}
    {!!title && !!subtitle && <br />}
    {!!subtitle && <span>{subtitle}</span>}
  </small>
)

UITooltip.styles = {
  element: {
    display: 'block',
    textAlign: 'center',
    lineHeight: '1.5',
  },
  title: {
    fontWeight: 600,
    fontSize: '1.2em',
  },
}

export const Tooltip = memo(UITooltip)
