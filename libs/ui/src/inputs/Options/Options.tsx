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
  testChecked: (input: InputInterface, value: any) => boolean
  onReset?: () => void
  disabled?: boolean
  display?: 'grid' | 'column'
}

const UIOptions = ({ type, label, options, value, onChange, testChecked, onReset, disabled, display = 'grid', ...props }: OptionsProps) => {
  const styles = useMemo(() => ({
    ...UIOptions.styles,
    option: {
      grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, 12em)',
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
      <label sx={styles.label} onClick={!disabled ? onReset : undefined} style={(!disabled && onReset) ? { cursor: 'pointer' } : {}}>
        {label}
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
    paddingBottom: 4,
    fontWeight: 'semibold',
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
