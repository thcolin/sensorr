import { memo } from 'react'

export interface CommandTab {
  value: string
  emoji: string
  label: string
  count: number
}

interface CommandTabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  options: CommandTab[]
  value: string | null
  onChange: (value: string | null) => void
}

// One command at a time, `null` shows them all. Sits flush under a `primary` head.
const UICommandTabs = ({ options, value, onChange, ...props }: CommandTabsProps) => {
  const tabs = [
    { value: null, emoji: '📼', label: 'all', count: options.reduce((total, option) => total + option.count, 0) },
    ...options,
  ]

  return (
    <div role='group' aria-label='Filter by command' {...props} sx={UICommandTabs.styles.element}>
      {tabs.map(tab => (
        <button key={tab.value || 'all'} type='button' aria-pressed={tab.value === value} onClick={() => onChange(tab.value)}>
          <span aria-hidden={true}>{tab.emoji}</span>
          <code>{tab.label}</code>
          <span data-digits={String(tab.count).length}>{tab.count}</span>
        </button>
      ))}
    </div>
  )
}

UICommandTabs.styles = {
  element: {
    position: 'sticky',
    top: '0px',
    zIndex: 2,
    display: 'flex',
    alignItems: 'flex-end',
    gap: '1.5em',
    overflowX: 'auto',
    scrollbarWidth: 'none',
    '::-webkit-scrollbar': {
      display: 'none',
    },
    backgroundColor: 'primary',
    paddingX: [4, 3],
    '>button': {
      variant: 'button.reset',
      position: 'relative',
      flexShrink: 0,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.4em',
      paddingTop: '0.35em',
      paddingBottom: '0.65em',
      color: 'rgba(255, 255, 255, 0.74)',
      whiteSpace: 'nowrap',
      cursor: 'pointer',
      transition: 'color 140ms ease-out',
      ':hover': {
        color: 'whitePure',
      },
      ':focus-visible': {
        outline: '2px solid',
        outlineColor: 'whitePure',
        outlineOffset: '-2px',
      },
      '>span:first-of-type': {
        fontSize: '0.875em',
        lineHeight: 1,
        marginRight: '0.25em',
      },
      '>code': {
        fontFamily: 'monospace',
        fontSize: '0.8125em',
        fontWeight: 'medium',
        lineHeight: 1.2,
      },
      '>span:last-of-type': {
        display: 'inline-block',
        boxSizing: 'border-box',
        minWidth: '1.7em',
        height: '1.7em',
        paddingX: '0.5em',
        borderRadius: '0.85em',
        textAlign: 'center',
        fontFamily: 'monospace',
        fontSize: '0.625em',
        fontWeight: 'semibold',
        lineHeight: '1.7em',
        fontVariantNumeric: 'tabular-nums',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        color: 'whitePure',
        // Fira Code draws a lone digit left of its advance
        '&[data-digits="1"]': {
          paddingLeft: '0.55em',
          paddingRight: '0.45em',
        },
      },
      '&[aria-pressed="true"]': {
        color: 'whitePure',
        '::after': {
          content: '""',
          position: 'absolute',
          left: '0px',
          right: '0px',
          bottom: '0px',
          height: '2px',
          backgroundColor: 'whitePure',
        },
        '>code': {
          fontWeight: 'strong',
        },
        '>span:last-of-type': {
          backgroundColor: 'accentDarkest',
        },
      },
    },
  },
}

export const CommandTabs = memo(UICommandTabs)
