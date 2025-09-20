import { memo, useMemo } from 'react'

interface OptionProps extends React.HTMLAttributes<HTMLInputElement> {
  id: string
  type: 'radio' | 'checkbox'
  children?: React.ReactNode
  checked: boolean
  behavior?: 'checkbox' | 'toggle' | 'radio'
  borderless?: boolean
  disabled?: boolean
}

const UIOption = ({ id, type, behavior = 'checkbox', borderless = false, children = null, ...props }: OptionProps) => {
  const styles = useMemo(() => ({
    ...UIOption.styles,
    element: {
      ...UIOption.styles.element,
      ...(!props.disabled ? { cursor: 'pointer' } : {}),
    },
    input: {
      ...UIOption.styles.input,
      borderRadius: { radio: '50%', checkbox: '0.125em' }[type],
      border: borderless ? 'none' : '0.075em solid',
      marginRight: children ? 4 : 12,
      '&:not(:checked) + svg': {
        opacity: behavior === 'checkbox' ? 0 : 1,
      },
    },
  }), [type, borderless, children, props.disabled])

  return (
    <label sx={styles.element} key={id} htmlFor={id} {...(props.title ? { title: props.title } : {} )}>
      <input {...props} id={id} type={type} sx={styles.input} />
      {props.checked ? (
        <svg sx={{ ...styles.checked, padding: 10 }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
          <path fill="currentColor" d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"/>
        </svg>
      ) : behavior === 'radio' ? (
        <svg sx={{ ...styles.checked, padding: 10 }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
          <path fill="currentColor" d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"/>
        </svg>
      ) : (
        <svg sx={{ ...styles.checked, padding: 11 }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm9 12c0 1.94-.624 3.735-1.672 5.207l-12.535-12.535c1.472-1.048 3.267-1.672 5.207-1.672 4.962 0 9 4.038 9 9zm-18 0c0-1.94.624-3.735 1.672-5.207l12.534 12.534c-1.471 1.049-3.266 1.673-5.206 1.673-4.962 0-9-4.038-9-9z"/>
        </svg>
      )}
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
    boxSizing: 'border-box',
  },
  input: {
    variant: 'input.reset',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '1em',
    width: '1em',
    borderColor: 'inherit',
    '&:not(:disabled)': {
      cursor: 'pointer',
    },
  },
  checked: {
    position: 'absolute',
    display: 'block',
    height: '1em',
    width: '1em',
    boxSizing: 'border-box',
  },
}

export const Option = memo(UIOption)
