import { memo } from 'react'

export interface LabelProps {
  label: string
  children: React.ReactNode
}

const UILabel = ({ label, ...props }: LabelProps) => (
  <label sx={UILabel.styles.element}>
    <span>{label}</span>
    {props.children}
  </label>
)

UILabel.styles = {
  element: {
    '>span:first-of-type': {
      display: 'block',
      marginBottom: 8,
      fontFamily: 'heading',
      fontWeight: 'bold',
    }
  },
}

export const Label = memo(UILabel)
