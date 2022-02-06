import { memo, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import nanobounce from 'nanobounce'

export interface WheelProps {
  label: string
  getOptions: (value: Date) => Date[]
  value: Date
  onChange: (value: Date) => void
  disabled?: boolean
}

const UIWheel = ({ label, getOptions, value, onChange, disabled, ...props }: WheelProps) => {
  const { i18n } = useTranslation()
  const debounce = useMemo(() => nanobounce(400), [])
  const [state, setState] = useState(value)

  useEffect(() => {
    setState(value)
  }, [value])

  return (
    <div sx={UIWheel.styles.element}>
      {getOptions(state).map((option, index) => (
        <button
          key={option.toISOString().substring(0, 10)}
          onClick={() => {
            setState(option)
            debounce(() => onChange(option))
          }}
          disabled={option.toISOString().substring(0, 10) === state.toISOString().substring(0, 10)}
          style={{
            left: ['-25%', '0%', '25%', '75%', '100%'][index],
            width: ['25%', '25%', '50%', '25%', '25%'][index],
          }}
        >
          <span>{option.toLocaleString(i18n.language, { month: 'long' })}</span>
          <span>{option.getFullYear()}</span>
        </button>
      ))}
    </div>
  )
}

UIWheel.styles = {
  element: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '18em',
    overflow: 'hidden',
    '>button': {
      variant: 'button.reset',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      position: 'absolute',
      paddingX: 4,
      fontSize: 6,
      transition: 'all 200ms ease-in-out',
      '>span': {
        display: 'block',
        marginY: '0.125rem',
        '&:first-of-type': {
          textTransform: 'capitalize',
        },
      },
      '&:disabled': {
        fontSize: 4,
        fontWeight: 'bold',
      },
    },
  },
}

export const Wheel = memo(UIWheel)
