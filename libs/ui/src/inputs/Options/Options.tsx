import { memo, useMemo } from 'react'
import { Option } from '../Option/Option'

interface InputInterface {
  emoji?: string
  label: string
  value: string
  count?: number
}

export interface OptionsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  type: 'radio' | 'checkbox'
  label: React.ReactNode
  options: InputInterface[]
  value: any
  onChange: (e: React.ChangeEvent<HTMLInputElement>, input: InputInterface, value: any) => void
  behavior?: 'or' | 'and'
  onBehavior?: (value: 'or' | 'and') => void
  testChecked: (input: InputInterface, value: any) => boolean
  onReset?: () => void
  disabled?: boolean
  display?: 'grid' | 'column'
}

const UIOptions = ({ type, label, options, value, onChange, behavior, onBehavior, testChecked, onReset, disabled, display = 'grid', ...props }: OptionsProps) => {
  const styles = useMemo(() => ({
    ...UIOptions.styles,
    option: {
      grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, 22em)',
        justifyContent: 'space-between',
      },
      column: {
        display: 'flex',
        flexDirection: 'column',
      },
    }[display],
  }), [display])

  if (!options?.length) {
    return null
  }

  return (
    <div sx={styles.element} {...props}>
      <label sx={UIOptions.styles.label}>
        <span
          onClick={() => !disabled && onReset && onReset()}
          style={!disabled && onReset ? { cursor: 'pointer' } : {}}
        >
          {label}
        </span>
        {!!(behavior && onBehavior) && (
          <span
            sx={UIOptions.styles.badge}
            onClick={() => onBehavior({ and: 'or', or: 'and' }[behavior] as any)}
            style={!disabled ? { cursor: 'pointer' } : {}}
          >
            {behavior}
          </span>
        )}
      </label>
      <div sx={styles.option}>
        {options.map((input) => (
          <Option
            key={input.value}
            id={input.value}
            type={type}
            checked={testChecked(input, value)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e, input, value)}
            disabled={disabled}
          >
            {input.emoji && <span sx={styles.emoji}>{input.emoji}</span>}
            <span>{input.label}</span>
            {typeof input.count === 'number' && (
              <code sx={styles.count}>
                ({input.count})
              </code>
            )}
          </Option>
        ))}
      </div>
    </div>
  )
}

UIOptions.styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    display: 'inline-flex',
    paddingBottom: 4,
    alignItems: 'center',
    fontWeight: 'semibold',
    '>*:first-of-type': {
      flex: 1,
    },
  },
  badge: {
    padding: '0.25em 0.375em 0.125em 0.375em',
    paddingY: 10,
    paddingX: 9,
    border: '1px solid',
    borderColor: 'inherit',
    borderRadius: '0.25em',
    fontFamily: 'monospace',
    fontSize: 6,
    fontWeight: 600,
    textTransform: 'uppercase',
    color: 'inherit',
  },
  emoji: {
    marginRight: 8,
  },
  count: {
    marginLeft: 8,
    fontSize: 6,
  },
}

export const Options = memo(UIOptions)
