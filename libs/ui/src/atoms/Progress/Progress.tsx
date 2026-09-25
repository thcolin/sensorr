import { memo } from 'react'

export interface ProgressProps extends React.ProgressHTMLAttributes<HTMLProgressElement> {
  value: number
  max: number
  // Splits the bar into parts sized by their `max`, each filled with its own `value`
  segments?: { value: number, max: number }[]
}

const UIProgress = ({ value, max, segments, ...props }: ProgressProps) => {
  if (!(max > 0)) {
    return null
  }

  const parts = (segments || []).filter(segment => segment.max > 0)

  if (parts.length > 1) {
    return (
      <div
        className={props.className}
        style={props.style}
        title={props.title}
        role='progressbar'
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.min(value, max)}
        sx={UIProgress.styles.segments}
      >
        {parts.map((segment, index) => (
          <span key={index} style={{ flexGrow: segment.max }}>
            <span style={{ transform: `scaleX(${Math.min(segment.value, segment.max) / segment.max})` }} />
          </span>
        ))}
      </div>
    )
  }

  return (
    <progress {...props} value={Math.min(value, max)} max={max} sx={UIProgress.styles.element} />
  )
}

UIProgress.styles = {
  element: {
    appearance: 'none',
    display: 'block',
    width: '100%',
    height: '0.25em',
    margin: 12,
    border: 'none',
    borderRadius: '2em',
    overflow: 'hidden',
    backgroundColor: 'grayDarker',
    color: 'primary',
    '::-webkit-progress-bar': {
      backgroundColor: 'grayDarker',
    },
    '::-webkit-progress-value': {
      backgroundColor: 'primary',
      transition: 'width 400ms ease-in-out',
    },
    '::-moz-progress-bar': {
      backgroundColor: 'primary',
    },
  },
  // Same bar as `element`, a hairline gap lets the background through between two parts
  segments: {
    display: 'flex',
    gap: '1px',
    '@media (min-resolution: 2dppx)': {
      gap: '0.5px',
    },
    width: '100%',
    height: '0.25em',
    margin: 12,
    borderRadius: '2em',
    overflow: 'hidden',
    '>span': {
      flexBasis: 0,
      minWidth: 0,
      backgroundColor: 'grayDarker',
      '>span': {
        display: 'block',
        width: '100%',
        height: '100%',
        backgroundColor: 'primary',
        transformOrigin: 'left',
        transition: 'transform 400ms ease-in-out',
      },
    },
  },
}

export const Progress = memo(UIProgress)
