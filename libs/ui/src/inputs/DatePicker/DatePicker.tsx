import { memo, useCallback, useEffect, useState } from 'react'
import { addMonths, addYears, subMonths, subYears } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { useDevice } from '@sensorr/utils'

export interface DatePickerProps {
  label: string
  getOptions: (value: Date) => Date[]
  value: Date
  onChange: (value: Date) => void
  disabled?: boolean
}

const UIDatePicker = ({ label, getOptions, value, onChange, disabled, ...props }: DatePickerProps) => {
  const { i18n } = useTranslation()
  const device = useDevice()
  const [state, setState] = useState(value)

  // Straight through: a calendar moves on the click, and a page cancels the fetch a newer month replaces
  const handleChange = useCallback((value) => {
    setState(value)
    onChange(value)
  }, [onChange])

  useEffect(() => {
    setState(value)
  }, [value])

  return (
    <div sx={UIDatePicker.styles.element}>
      <div sx={UIDatePicker.styles.year}>
        <button
          onClick={() => handleChange(subYears(state, 1))}
          disabled={state.getFullYear() === 1900}
          sx={UIDatePicker.styles.navigation}
        >
          ‹
        </button>
        <select
          value={state.getFullYear()}
          onChange={(e) => handleChange(new Date(Number(e.target.value), state.getMonth(), state.getDate()))}
        >
          {Array(new Date().getFullYear() + 8 - 1900)
            .fill(0)
            .map((_, index) => (
              <option key={index} value={index + 1900}>
                {index + 1900}
              </option>
            ))}
        </select>
        <button
          onClick={() => handleChange(addYears(state, 1))}
          disabled={new Date().getFullYear() + 7 === state.getFullYear()}
          sx={UIDatePicker.styles.navigation}
        >
          ›
        </button>
      </div>
      <div sx={UIDatePicker.styles.container}>
        <button
          onClick={() => handleChange(subMonths(state, 1))}
          disabled={state.getFullYear() === 1900 && state.getMonth() === 0}
          sx={UIDatePicker.styles.navigation}
        >
          ‹
        </button>
        {Array(device === 'mobile' ? 5 : 12)
          .fill(0)
          .map((_, i) => {
            const index = (i + (device === 'mobile' ? state.getMonth() - 2 : 0) + 12) % 12

            return (
              <button
                key={index}
                onClick={() => handleChange(new Date(state.getFullYear(), index, 1))}
                disabled={device === 'mobile' && (
                  (state.getFullYear() === 1900 && state.getMonth() <= 2 && index >= 10) ||
                  (new Date().getFullYear() + 7 === state.getFullYear() && state.getMonth() >= 10 && index <= 4)
                )}
                sx={{
                  ...UIDatePicker.styles.month,
                  backgroundColor: state.getMonth() === index ? 'whitePure' : 'transparent',
                  color: state.getMonth() === index ? 'primary' : 'whitePure',
                  ':hover': {
                    backgroundColor: state.getMonth() === index ? 'whitePure' : 'primaryDarker',
                  },
                }}
              >
                <span>
                  {new Date(state.getFullYear(), index, 1).toLocaleString(i18n.language, {
                    month: 'short',
                  })}
                </span>
              </button>
            )
          })}
        <button
          onClick={() => handleChange(addMonths(state, 1))}
          disabled={new Date().getFullYear() + 7 === state.getFullYear() && state.getMonth() === 11}
          sx={UIDatePicker.styles.navigation}
        >
          ›
        </button>
      </div>
    </div>
  )
}

UIDatePicker.styles = {
  element: {
    display: 'flex',
    alignItems: 'stretch',
    justifyContent: 'center',
    flexDirection: 'column',
    backgroundColor: 'primaryDark',
  },
  year: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'primaryDarker',
    '>select': {
      flex: 1,
      variant: 'select.reset',
      fontFamily: 'heading',
      fontSize: 2,
      fontWeight: 'bold',
      color: 'whitePure',
    },
  },
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navigation: {
    variant: 'button.reset',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '2em',
    width: '2em',
    borderRadius: '50%',
    marginX: 6,
    ':disabled': {
      opacity: 0.5,
    },
    ':hover:not(:disabled)': {
      backgroundColor: 'primaryDarkest',
    },
  },
  month: {
    variant: 'button.reset',
    flex: 1,
    border: 'none',
    fontSize: 5,
    paddingX: 8,
    paddingY: 6,
    overflow: 'hidden',
    minWidth: '3.5em',
    ':disabled': {
      opacity: 0.5,
    },
  },
}

export const DatePicker = memo(UIDatePicker)
