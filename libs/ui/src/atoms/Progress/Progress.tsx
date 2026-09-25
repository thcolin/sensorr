import { memo } from 'react'

export interface ProgressProps extends React.ProgressHTMLAttributes<HTMLProgressElement> {
  value: number
  max: number
}

const UIProgress = ({ value, max, ...props }: ProgressProps) => max > 0 ? (
  <progress {...props} value={Math.min(value, max)} max={max} sx={UIProgress.styles.element} />
) : null

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
}

export const Progress = memo(UIProgress)
