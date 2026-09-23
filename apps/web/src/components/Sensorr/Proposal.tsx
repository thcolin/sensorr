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

const UITransition = ({ axis = '', from = null, to = null, policy = null, compact = false, ...props }) => {
  const { state, separator, left, right } = useMemo(() => transitionOf(axis, from, to, policy), [axis, from, to, policy])
  const styles = compact ? UITransition.styles.compact : UITransition.styles.full

  if (state === 'same') {
    return (
      <span {...props} sx={{ ...UITransition.styles.element, ...styles.element, opacity: 0.3 }} title={`${axis}: ${to}`}>
        <span sx={{ ...UITransition.styles.side, ...styles.side }}>
          <Value axis={axis} value={to} compact={compact} />{!compact && !!right.mark && <sup>{right.mark}</sup>}
        </span>
      </span>
    )
  }

  return (
    <span {...props} sx={{ ...UITransition.styles.element, ...styles.element }} title={`${axis}: ${from} ${separator} ${to}`}>
      <span sx={{ ...UITransition.styles.side, ...styles.side, ...UITransition.styles.before }}>
        <Value axis={axis} value={from} compact={compact} />{!compact && !!left.mark && <sup>{left.mark}</sup>}
      </span>
      <span sx={{ ...UITransition.styles.separator, ...styles.separator }}>{separator}</span>
      <span sx={{ ...UITransition.styles.side, ...styles.side, ...(UITransition.styles as any)[state] }}>
        <Value axis={axis} value={to} compact={compact} />{!compact && !!right.mark && <sup>{right.mark}</sup>}
      </span>
    </span>
  )
}

UITransition.styles = {
  element: {
    display: 'inline-flex',
    alignItems: 'stretch',
    maxWidth: '100%',
    borderRadius: '0.25em',
    border: '1px solid',
    borderColor: 'grayDark',
    overflow: 'hidden',
    fontFamily: 'monospace',
    whiteSpace: 'nowrap',
    lineHeight: 'normal',
    backgroundColor: 'gray',
    color: 'text',
  },
  side: {
    display: 'inline-flex',
    alignItems: 'center',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    '>sup': {
      fontSize: 8,
      marginLeft: 11,
      opacity: 0.75,
    },
  },
  before: {
    backgroundColor: 'grayLight',
    opacity: 0.6,
  },
  separator: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    backgroundColor: 'grayLight',
    color: 'grayDarker',
  },
  held: {
    backgroundColor: 'primary',
    color: 'whitePure',
    fontWeight: 'semibold',
  },
  broken: {
    backgroundColor: 'errorDarker',
    color: 'whitePure',
    fontWeight: 'semibold',
  },
  moved: {
    fontWeight: 'semibold',
  },
  quiet: {},
  full: {
    element: { fontSize: 5 },
    side: { paddingX: 8, paddingY: 10 },
    separator: { width: '1.5em', fontSize: 6 },
  },
  compact: {
    element: { fontSize: 7 },
    side: { paddingX: 10, paddingY: 11, maxWidth: '9em' },
    separator: { width: '1.25em', fontSize: 7 },
  },
}

export const Transition = memo(UITransition)

export default Transition
