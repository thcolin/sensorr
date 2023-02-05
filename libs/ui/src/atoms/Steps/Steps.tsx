import { Children, memo } from 'react'

export interface StepsProps {
  value: number
  children: React.ReactElement<any, any>[]
}

const UISteps = ({ children, value, ...props }: StepsProps) => {
  return (
    <div sx={UISteps.styles.element}>
      <div>
        {Array(Children.count(children)).fill(true).map((_, i) => (
          <i key={i} data-enabled={i === value}></i>
        ))}
      </div>
      <div style={{ transform: `translateX(-${ value * 100}%)` }}>
        {children}
      </div>
    </div>
  )
}

UISteps.styles = {
  element: {
    marginY: 4,
    overflow: 'hidden',
    '&>div:first-child': {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
      '&>i': {
        width: '0.5rem',
        height: '0.5rem',
        borderRadius: '50%',
        backgroundColor: 'grayDark',
        transition: 'all 100ms ease-in-out',
        '&[data-enabled=true]': {
          backgroundColor: '#fff',
        },
        '&:not(:last-child)': {
          marginRight: '0.5rem',
        },
      },
    },
    '&>div:last-child': {
      display: 'flex',
      transition: 'transform 400ms ease-in-out',
      '>*': {
        flexGrow: 1,
        flexShrink: 0,
        flexBasis: '100%',
      },
    },
  },
}

export const Steps = memo(UISteps)
