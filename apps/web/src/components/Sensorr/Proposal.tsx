import { memo, useMemo } from 'react'
import { transitionOf } from '../../pages/Proposals/queue'
import { logos } from './Release'

// The language keeps its name next to its flag: MULTi-VFF and MULTi-VF2 share one.
const UIValue = ({ axis, value, compact = false }) => {
  const logo = logos[axis]?.[value]
  const drawn = !!logo && logo.type !== 'code'

  if (!value) {
    return <span title='not found in the release name'>?</span>
  }

  if (axis === 'language') {
    return <>{drawn && <span sx={UIValue.styles.logo}>{logo}</span>}{value}</>
  }

  return drawn && !compact ? <span sx={UIValue.styles.logo} title={value}>{logo}</span> : <>{value}</>
}

UIValue.styles = {
  logo: {
    display: 'inline-flex',
    alignItems: 'center',
    marginRight: 10,
    '>svg': {
      height: '1.25em',
      color: 'text',
    },
    '>abbr': {
      textDecoration: 'none',
    },
  },
}

const Value = memo(UIValue)

// The new value sits on top of the old one, one tint brighter in the same hue.
// `state` overrides the policy for a comparison no policy covers, like the size.
const UITransition = ({ axis = '', from = null, to = null, policy = null, compact = false, state: forced = null, ...props }) => {
  const { state: computed, separator } = useMemo(() => transitionOf(axis, from, to, policy), [axis, from, to, policy])
  const state = forced || computed
  const side = UITransition.styles.side
  const element = { ...UITransition.styles.element, fontSize: compact ? 6 : 5 }
  const tint = UITransition.styles.tints[state] || UITransition.styles.tints.quiet

  if (state === 'same') {
    return (
      <span {...props} sx={{ ...element, opacity: 0.3 }} title={`${axis}: ${to}`}>
        <span sx={{ ...side, ...tint.after }}>
          <Value axis={axis} value={to} compact={compact} />
        </span>
      </span>
    )
  }

  return (
    <span {...props} sx={element} title={`${axis}: ${from} ${separator} ${to}`}>
      <span sx={{ ...side, ...UITransition.styles.before, ...tint.before }}>
        <Value axis={axis} value={from} compact={compact} />
      </span>
      <span sx={{ ...side, ...UITransition.styles.after, ...tint.after }}>
        <Value axis={axis} value={to} compact={compact} />
      </span>
    </span>
  )
}

UITransition.styles = {
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
  },
}

export const Transition = memo(UITransition)

export default Transition
