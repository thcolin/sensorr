import { memo, useState } from 'react'
import { ShowStateOptions, State } from '@sensorr/ui'

const OPTIONS = ShowStateOptions.filter(({ value }) => ['ignored', 'followed'].includes(value))

// Follows a season or an episode: the state select of a poster (`ShowState`), 🔕 Ignored or 📺 Followed
const UIFollow = ({ checked, onChange, disabled = false, name, title }) => {
  const [pending, setPending] = useState(false)

  const handleChange = async (value) => {
    setPending(true)
    await Promise.resolve(onChange(value === 'followed')).catch(() => null)
    setPending(false)
  }

  return (
    <fieldset disabled={disabled || pending} aria-busy={pending} data-follow={true} sx={UIFollow.styles.element}>
      <State
        value={checked ? 'followed' : 'ignored'}
        options={OPTIONS}
        onChange={handleChange}
        compact={true}
        size='small'
        aria-label={name}
        title={title}
      />
    </fieldset>
  )
}

UIFollow.styles = {
  element: {
    minWidth: 0,
    margin: 12,
    padding: 12,
    border: 'none',
    '>label': {
      borderRadius: '50%',
      '>span': {
        transition: 'background-color 200ms ease-in-out',
      },
      // 44px of touch target on a phone around a badge of 20px
      '>select': {
        top: ['-0.75em', '-0.5em'],
        left: ['-0.75em', '-0.5em'],
        width: ['calc(100% + 1.5em)', 'calc(100% + 1em)'],
        height: ['calc(100% + 1.5em)', 'calc(100% + 1em)'],
      },
      ':has(select:focus-visible)': {
        outline: '1px solid',
        outlineColor: 'grayDarkest',
        outlineOffset: '2px',
      },
    },
    '&:not(:disabled) >label:hover >span': {
      backgroundColor: 'grayDark',
    },
    ':disabled': {
      opacity: 0.5,
      '>label >select': {
        cursor: 'default',
      },
    },
    '&[aria-busy="true"]': {
      opacity: 1,
      '>label >select': {
        cursor: 'progress',
      },
    },
  },
}

export const Follow = memo(UIFollow)
