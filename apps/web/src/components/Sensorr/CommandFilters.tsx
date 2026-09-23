import { memo } from 'react'

export interface CommandFilter {
  value: string
  emoji: string
  label: string
  count: number
}

interface CommandFiltersProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  options: CommandFilter[]
  value: string[]
  onChange: (value: string[]) => void
}

// An empty `value` means every command is shown, and `all` is the only chip pressed.
const UICommandFilters = ({ options, value, onChange, ...props }: CommandFiltersProps) => (
  <div role='group' aria-label='Filter by command' {...props} sx={UICommandFilters.styles.element}>
    <button type='button' aria-pressed={!value.length} onClick={() => onChange([])}>
      {!value.length && <span aria-hidden={true}>✓</span>}
      <code>all <span>{options.reduce((total, option) => total + option.count, 0)}</span></code>
    </button>
    {options.map((option) => {
      const pressed = value.includes(option.value)

      return (
        <button
          key={option.value}
          type='button'
          aria-pressed={pressed}
          onClick={() => onChange(pressed ? value.filter(v => v !== option.value) : [...value, option.value])}
        >
          <span aria-hidden={true}>{pressed ? '✓' : option.emoji}</span>
          <code>{option.label} <span>{option.count}</span></code>
        </button>
      )
    })}
  </div>
)

UICommandFilters.styles = {
  element: {
    position: 'sticky',
    top: '0px',
    zIndex: 2,
    display: 'flex',
    flexWrap: 'wrap',
    gap: 9,
    padding: 7,
    backgroundColor: 'grayLighter',
    borderBottom: '1px solid',
    borderColor: 'grayLight',
    '>button': {
      variant: 'button.reset',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 9,
      minHeight: '2.25em',
      paddingX: 6,
      borderRadius: '1em',
      border: '1px solid',
      borderColor: 'grayDark',
      backgroundColor: 'transparent',
      color: 'text',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      ':hover': {
        borderColor: 'grayDarker',
      },
      ':focus-visible': {
        outline: '2px solid',
        outlineColor: 'primary',
        outlineOffset: '2px',
      },
      '&[aria-pressed="true"]': {
        backgroundColor: 'accentDarkest',
        borderColor: 'accentDarkest',
        color: 'whitePure',
        '>code>span': {
          opacity: 1,
        },
      },
      '>code': {
        fontFamily: 'monospace',
        fontSize: 6,
        '>span': {
          opacity: 0.75,
        },
      },
    },
  },
}

export const CommandFilters = memo(UICommandFilters)
