import { memo, useMemo } from 'react'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  emoji: React.ReactNode
  label?: React.ReactNode
  compact?: boolean
  size?: 'small' | 'normal'
  color?: 'auto' | 'dark' | 'light'
}

const UIBadge = ({
  emoji,
  label = null,
  compact = false,
  size = 'normal',
  color = 'dark',
  ...props
}: BadgeProps) => {
  const styles = useMemo(() => ({
    element: {
      ...UIBadge.styles.element,
      ...(compact ? UIBadge.styles.compact : {}),
      ...(!label ? UIBadge.styles.noLabel : {}),
      ...UIBadge.styles.sizes[size],
    backgroundColor: {
      auto: 'shadow',
      dark: 'darkShadow',
      light: 'lightShadow',
    }[color],
  }
  }), [compact, label, size, color])

  return (
    <span {...props} sx={styles.element}>
      <span sx={UIBadge.styles.emoji}>{emoji}</span>
      {!!label && <label sx={UIBadge.styles.label}>{label}</label>}
    </span>
  )
}

UIBadge.styles = {
  element: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    userSelect: 'none',
    borderRadius: 0,
    padding: 5,
    paddingX: 3,
  },
  emoji: {
    lineHeight: 'reset',
  },
  label: {
    marginLeft: 6,
    fontWeight: 800,
    color: 'shadowText',
    textTransform: 'uppercase',
    lineHeight: 'reset',
    cursor: 'inherit',
  },
  compact: {
    paddingX: 5,
    paddingY: 7,
  },
  noLabel: {
    borderRadius: '50%',
    paddingX: 7,
    paddingY: 7,
  },
  sizes: {
    small: {
      fontSize: [7, 6],
    },
    normal: {
      fontSize: [5, 4],
    },
  },
}

export const Badge = memo(UIBadge)
