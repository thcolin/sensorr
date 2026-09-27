import { memo } from 'react'
import { jobLabelOf } from '@sensorr/sensorr'

interface JobNameProps extends React.HTMLAttributes<HTMLSpanElement> {
  // A `jobNameOf` name
  name: string
  // Replaces the command, as `missing` does for `sync movies`
  label?: string
}

const UIJobName = ({ name, label, ...props }: JobNameProps) => {
  const { command, suffix } = jobLabelOf(name)

  return (
    <span {...props}>
      {label || command}
      {suffix && <small sx={UIJobName.styles.suffix}>{suffix}</small>}
    </span>
  )
}

UIJobName.styles = {
  suffix: {
    marginLeft: '0.5em',
    fontSize: '0.75em',
    fontWeight: 'normal',
    opacity: 0.6,
  },
}

export const JobName = memo(UIJobName)
