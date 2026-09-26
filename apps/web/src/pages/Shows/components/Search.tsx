import { memo } from 'react'
import { Badge, Icon } from '@sensorr/ui'

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
    // The touch target of the follow's select, but on a phone its gap belongs to the follow on its right
    '::after': {
      content: '""',
      position: 'absolute',
      inset: ['-0.75em 0 -0.75em -0.75em', '-0.5em'],
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
