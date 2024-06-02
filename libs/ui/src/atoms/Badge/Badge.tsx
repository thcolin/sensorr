import { memo, useMemo } from 'react'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  emoji: React.ReactNode
  label?: React.ReactNode
  compact?: boolean
  size?: 'small' | 'normal'
  color?: 'auto' | 'dark' | 'theme' | 'light'
  palette?: any
}

const UIBadge = ({
  emoji,
  label = null,
  compact = false,
  size = 'normal',
  color = 'dark',
  palette,
  ...props
}: BadgeProps) => {
  const hasLabel = (typeof label !== 'undefined' && label !== null && label !== false)
  const styles = useMemo(() => ({
    element: {
      ...UIBadge.styles.element,
      ...(compact ? UIBadge.styles.compact : {}),
      ...(!hasLabel ? UIBadge.styles.noLabel : {}),
      ...UIBadge.styles.sizes[size],
    backgroundColor: palette?.color || 'gray',
    color: palette?.backgroundColor || 'text',
    // backgroundColor: {
    //   auto: 'shadow',
    //   dark: 'grayShadow',
    //   theme: 'shadowTheme',
    //   light: 'whiteShadow',
    // }[color],
  }
  }), [compact, hasLabel, size, palette])

  return (
    <span {...props} sx={styles.element}>
      {!!emoji && <span sx={UIBadge.styles.emoji}>{emoji}</span>}
      {hasLabel && <label sx={{ ...UIBadge.styles.label, marginLeft: !!emoji ? 4 : 12 }}>{label}</label>}
    </span>
  )
}

UIBadge.styles = {
  element: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '2em',
    userSelect: 'none',
    borderRadius: '2em',
    whiteSpace: 'nowrap',
    // paddingX: 2,
    // paddingY: 6,
  },
  emoji: {
    lineHeight: 'reset',
  },
  label: {
    fontFamily: 'monospace',
    fontSize: 5,
    // color: 'text',
    textTransform: 'capitalize',
    lineHeight: 'reset',
    cursor: 'inherit',
  },
  compact: {
    paddingX: 5,
    paddingY: 7,
  },
  noLabel: {
    width: '2em',
    borderRadius: '50%',
    // paddingX: 7,
    // paddingY: 7,
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
