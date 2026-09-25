import { memo } from 'react'

export interface ProgressProps extends React.ProgressHTMLAttributes<HTMLProgressElement> {
  value: number
  max: number
  // Splits the bar into one pill per part, sized by its `max` and filled with its own `value`
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
        style={{ ...props.style, '--parts': parts.length } as React.CSSProperties}
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
  // One pill per part, each with the track and the fill of `element`
  segments: {
    display: 'flex',
    // A fifth of an average part, from 2px on a 5 seasons card down to half a pixel past 30 seasons
    gap: 'clamp(0.5px, calc(100% / var(--parts) / 5), 0.125em)',
    width: '100%',
    height: '0.25em',
    margin: 12,
    '>span': {
      flexBasis: 0,
      minWidth: 0,
      // Round ends while a pill is twice as wide as tall, flatter ends below so a narrow one does not shrink to a dot
      borderRadius: 'min(0.125em, 25%) / 0.125em',
      overflow: 'hidden',
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
