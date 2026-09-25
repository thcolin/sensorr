import { memo, useMemo } from 'react'
import { TransitionPill } from '@sensorr/ui'
import { filesize } from '@sensorr/utils'
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

// The pill of `@sensorr/ui`, colored by what the policy thinks of the new value.
// `state` overrides the policy for a comparison no policy covers, like the size.
const UITransition = ({ axis = '', from = null, to = null, policy = null, compact = false, state: forced = null, ...props }) => {
  const { state: computed, separator } = useMemo(() => transitionOf(axis, from, to, policy), [axis, from, to, policy])
  const state = forced || computed

  return (
    <TransitionPill
      {...props}
      from={<Value axis={axis} value={from} compact={compact} />}
      to={<Value axis={axis} value={to} compact={compact} />}
      state={state}
      compact={compact}
      unknown={{ from: !from, to: !to }}
      title={state === 'same' ? `${axis}: ${to}` : `${axis}: ${from} ${separator} ${to}`}
    />
  )
}

// "14.9 GB replaces 19 episodes (6.1 GB) and fills 1", with the counts of `swapOf` (libs/sensorr/src/lib/show.ts)
export const swapLabelOf = (size: number | undefined, swap: { fills: number, replaces: number, size: number }) => [
  typeof size === 'number' && filesize.stringify(size),
  `replaces ${swap.replaces} episode${swap.replaces > 1 ? 's' : ''} (${filesize.stringify(swap.size)})`,
  swap.fills > 0 && `and fills ${swap.fills}`,
].filter(Boolean).join(' ')

export const Transition = memo(UITransition)

export default Transition
