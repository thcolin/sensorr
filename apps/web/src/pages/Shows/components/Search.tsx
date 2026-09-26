import { memo } from 'react'
import { Badge, Icon } from '@sensorr/ui'

// Opens the release search of a season or an episode: the round badge of its follow (`Follow`), a magnifier in it
const UISearch = ({ onClick, disabled = false, title }) => (
  <button type='button' data-search={true} disabled={disabled} onClick={onClick} title={title} aria-label={title} sx={UISearch.styles.element}>
    <Badge emoji={<Icon value='search' width='1em' height='1em' />} compact={true} size='small' />
  </button>
)

UISearch.styles = {
  element: {
    variant: 'button.reset',
    display: 'flex',
    position: 'relative',
    borderRadius: '50%',
    '>span': {
      transition: 'background-color 200ms ease-in-out',
    },
    // 44px of touch target on a phone around a badge of 20px, as the follow's select
    '::after': {
      content: '""',
      position: 'absolute',
      inset: ['-0.75em', '-0.5em'],
    },
    ':hover:not(:disabled) >span': {
      backgroundColor: 'grayDark',
    },
    ':focus-visible': {
      outline: '1px solid',
      outlineColor: 'grayDarkest',
      outlineOffset: '2px',
    },
    ':disabled': {
      opacity: 0.5,
      cursor: 'default',
    },
  },
}

export const Search = memo(UISearch)
