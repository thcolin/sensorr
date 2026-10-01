import { memo, useEffect, useRef } from 'react'
import { jobLabelOf, jobNameOf } from '@sensorr/sensorr'
import { glide, useDragScroll } from '@sensorr/utils'

export interface CommandTab {
  value: string
  emoji: string
  label?: string
  count: number
}

interface CommandTabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  options: CommandTab[]
  all: number
  value: string | null
  onChange: (value: string | null) => void
}

const GROUPED = ['movies', 'tv']

// The commands met in `items`, or picked, the one running or met last first
export const commandTabsOf = (
  items: { meta: any }[],
  commands: { [name: string]: Omit<CommandTab, 'value' | 'count'> },
  value: string | null,
  timeOf: (item) => number,
  running: (name: string) => boolean = () => false,
): CommandTab[] => Object.keys(commands)
  .map(name => ({ name, matching: items.filter(item => jobNameOf(item.meta) === name) }))
  .filter(({ name, matching }) => name === value || matching.length)
  .map(({ name, matching }) => ({ name, matching, running: running(name), last: Math.max(0, ...matching.map(item => timeOf(item) || 0)) }))
  .sort((a, b) => Number(b.running) - Number(a.running) || b.last - a.last)
  .map(({ name, matching }) => ({ value: name, ...commands[name], count: matching.length }))

// Commands about one media type share a capsule named after it, the others stand alone as pills, in the order given
const capsulesOf = (tabs) => tabs.reduce((capsules, tab) => {
  const { suffix } = tab.value ? jobLabelOf(tab.value) : { suffix: null }
  const group = GROUPED.includes(suffix) ? suffix : null
  const capsule = group && capsules.find(capsule => capsule.group === group)

  if (capsule) {
    capsule.tabs.push(tab)
    return capsules
  }

  return [...capsules, { group, tabs: [tab] }]
}, [])

// One command at a time, `null` shows them all. Sits flush under a `primary` head.
const UICommandTabs = ({ options, all, value, onChange, ...props }: CommandTabsProps) => {
  const row = useRef<HTMLDivElement>(null)
  const drag = useDragScroll(row)

  // The pressed pill slides to the start of the row, where `all` sits at first
  useEffect(() => {
    const element = row.current
    const pressed = element?.querySelector<HTMLElement>('[aria-pressed="true"]')

    if (pressed) {
      glide(element, pressed.offsetLeft - parseFloat(getComputedStyle(element).paddingLeft))
    }
  }, [value])

  const capsules = capsulesOf([
    { value: null, emoji: '📼', label: 'all', count: all },
    ...options,
  ])

  const pill = (tab, group = null) => {
    const { command, suffix } = tab.value ? jobLabelOf(tab.value) : { command: tab.label, suffix: null }

    return (
      <button
        key={tab.value || 'all'}
        type='button'
        aria-pressed={tab.value === value}
        aria-label={group ? `${tab.label || command} ${group}` : undefined}
        onClick={() => onChange(tab.value)}
      >
        <span aria-hidden={true}>{tab.emoji}</span>
        <code>{tab.label || command}{!group && suffix ? ` ${suffix}` : ''}</code>
        <span data-digits={String(tab.count).length}>{tab.count}</span>
      </button>
    )
  }

  return (
    <div ref={drag} role='group' aria-label='Filter by command' {...props} sx={UICommandTabs.styles.element}>
      {capsules.map(({ group, tabs }) => group ? (
        <div key={group} role='group' aria-label={group}>
          <span>{group}</span>
          {tabs.map(tab => pill(tab, group))}
        </div>
      ) : pill(tabs[0]))}
    </div>
  )
}

UICommandTabs.styles = {
  element: {
    position: 'sticky',
    top: '0px',
    zIndex: 2,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '0.375em',
    overflowX: 'auto',
    scrollbarWidth: 'none',
    '::-webkit-scrollbar': {
      display: 'none',
    },
    backgroundColor: 'primary',
    paddingX: [4, 3],
    paddingBottom: 4,
    // A capsule: `accentDarkest` behind `accentDarker` pills, white on them measures 5.68:1 and 4.58:1
    '>div': {
      flexShrink: 0,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25em',
      height: '1.75em',
      paddingX: '0.1875em',
      boxSizing: 'border-box',
      borderRadius: '2em',
      backgroundColor: 'accentDarkest',
      '>span': {
        marginLeft: '0.9em',
        marginRight: '0.6em',
        fontFamily: 'monospace',
        fontSize: '0.625em',
        fontWeight: 'bold',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'whitePure',
      },
    },
    button: {
      variant: 'button.reset',
      flexShrink: 0,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.375em',
      height: '1.375em',
      paddingLeft: '0.6875em',
      paddingRight: '0.375em',
      boxSizing: 'border-box',
      borderRadius: '1.375em',
      backgroundColor: 'accentDarker',
      color: 'whitePure',
      whiteSpace: 'nowrap',
      cursor: 'pointer',
      transition: 'background-color 140ms ease-out',
      ':focus-visible': {
        outline: '2px solid',
        outlineColor: 'whitePure',
        outlineOffset: '-2px',
      },
      '>span:first-of-type': {
        fontSize: '0.875em',
        lineHeight: 1,
      },
      '>code': {
        fontFamily: 'monospace',
        fontSize: '0.8125em',
        fontWeight: 'medium',
        lineHeight: 1.2,
      },
      '>span:nth-of-type(2)': {
        display: 'inline-block',
        boxSizing: 'border-box',
        minWidth: '1.7em',
        height: '1.7em',
        paddingX: '0.6em',
        borderRadius: '0.85em',
        textAlign: 'center',
        fontFamily: 'monospace',
        fontSize: '0.625em',
        fontWeight: 'semibold',
        lineHeight: '1.7em',
        fontVariantNumeric: 'tabular-nums',
        backgroundColor: 'accentDarkest',
        color: 'whitePure',
        // Fira Code draws a lone digit left of its advance
        '&[data-digits="1"]': {
          paddingLeft: '0.55em',
          paddingRight: '0.45em',
        },
      },
      // The pill keeps its color, its name turns bold and its count white
      '&[aria-pressed="true"]': {
        '>code': {
          fontWeight: 'strong',
        },
        '>span:nth-of-type(2)': {
          backgroundColor: 'whitePure',
          color: 'accentDarkest',
        },
      },
    },
    // A pill alone sits on the row at the capsule's height
    '>button': {
      height: '1.75em',
      paddingLeft: '0.875em',
      paddingRight: '0.4375em',
      borderRadius: '2em',
    },
  },
}

export const CommandTabs = memo(UICommandTabs)
