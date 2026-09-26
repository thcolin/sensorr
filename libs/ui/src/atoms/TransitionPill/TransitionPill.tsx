import { memo } from 'react'

export interface TransitionPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  from?: React.ReactNode
  to: React.ReactNode
  state?: 'held' | 'broken' | 'moved' | 'quiet' | 'same' | 'airing'
  compact?: boolean
  // A side without a verdict stays gray whatever the state: an unknown value, or owned episodes behind the aired ones
  neutral?: { from?: boolean, to?: boolean }
}

// The new value sits on top of the old one, one tint brighter in the same hue.
// `same` draws the new value alone.
const UITransitionPill = ({ from = null, to = null, state = 'quiet', compact = false, neutral = {}, ...props }: TransitionPillProps) => {
  const side = UITransitionPill.styles.side
  const element = { ...UITransitionPill.styles.element, fontSize: compact ? 6 : 5 }
  const { quiet } = UITransitionPill.styles.tints
  const tint = UITransitionPill.styles.tints[state] || quiet
  const before = neutral.from ? quiet.before : tint.before
  const after = neutral.to ? quiet.after : tint.after

  if (state === 'same') {
    return (
      <span {...props} sx={{ ...element, opacity: compact ? 1 : 0.3 }}>
        <span sx={{ ...side, ...after }}>{to}</span>
      </span>
    )
  }

  return (
    <span {...props} sx={element}>
      <span sx={{ ...side, ...UITransitionPill.styles.before, ...before }}>{from}</span>
      <span sx={{ ...side, ...UITransitionPill.styles.after, ...after }}>{to}</span>
    </span>
  )
}

UITransitionPill.styles = {
  element: {
    display: 'inline-flex',
    alignItems: 'stretch',
    maxWidth: '100%',
    fontFamily: 'monospace',
    whiteSpace: 'nowrap',
    lineHeight: 'normal',
    fontWeight: 'normal',
  },
  side: {
    display: 'inline-flex',
    alignItems: 'center',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    borderRadius: '1em',
    paddingX: 6,
    paddingY: 10,
  },
  // Square under the new value, so its rounded end sits on a full fill.
  before: {
    borderTopRightRadius: '0em',
    borderBottomRightRadius: '0em',
    marginRight: '-1em',
    paddingRight: '1.75em',
  },
  after: {
    position: 'relative',
  },
  tints: {
    held: {
      before: { backgroundColor: 'accentDarkest', color: 'primaryLightest' },
      after: { backgroundColor: 'primaryDarkest', color: 'whitePure' },
    },
    broken: {
      before: { backgroundColor: 'errorDarkest', color: 'text' },
      after: { backgroundColor: 'errorDark', color: 'whitePure' },
    },
    quiet: {
      before: { backgroundColor: 'gray', color: 'grayDarkest' },
      after: { backgroundColor: 'grayDark', color: 'text' },
    },
    // A series still on air, whose aired count will grow
    airing: {
      before: { backgroundColor: 'airingDarkest', color: 'airingLightest' },
      after: { backgroundColor: 'airingDark', color: 'whitePure' },
    },
  },
}

export const TransitionPill = memo(UITransitionPill)
