import { memo, useMemo } from 'react'

interface OptionProps extends React.HTMLAttributes<HTMLInputElement> {
  id: string
  type: 'radio' | 'checkbox'
  children: React.ReactNode
  checked: boolean
  disabled?: boolean
}

const UIOption = ({ id, type, children, ...props }: OptionProps) => {
  const styles = useMemo(() => ({
    ...UIOption.styles,
    element: {
      ...UIOption.styles.element,
      ...(!props.disabled ? { cursor: 'pointer' } : {}),
    },
    input: {
      ...UIOption.styles.input,
      borderRadius: { radio: '50%', checkbox: '0.125em' }[type],
    },
  }), [type, props.disabled])

  return (
    <label sx={styles.element} key={id} htmlFor={id}>
      <input {...props} id={id} type={type} sx={styles.input} />
      <svg sx={styles.checked} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
        <path fill="currentColor" d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"/>
      </svg>
      {children}
    </label>
  )
}

UIOption.styles = {
  element: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    marginY: 8,
  },
  input: {
    variant: 'input.reset',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '1em',
    width: '1em',
    border: '0.075em solid',
    borderColor: 'inherit',
    marginRight: 4,
    '&:not(:disabled)': {
      cursor: 'pointer',
    },
    '&:not(:checked) + svg': {
      opacity: 0,
    },
  },
  checked: {
    position: 'absolute',
    display: 'block',
    height: '1em',
    width: '1em',
    padding: 10,
  },
}

export const Option = memo(UIOption)
