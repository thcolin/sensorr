import { useLayoutEffect, useRef, useState } from 'react'

export interface CapsuleOption {
  value: string
  label: React.ReactNode
  title?: string
  disabled?: boolean
}

interface CapsuleProps {
  name: string
  labelledBy: string
  options: CapsuleOption[]
  value: string | null
  onChange: (value: string) => void
}

// A radio group as a capsule: the checked pill filled with the green of a primary button and sliding, the others let through
export const Capsule = ({ name, labelledBy, options, value, onChange }: CapsuleProps) => {
  const capsule = useRef(null)
  const [pill, setPill] = useState(null)

  // Measured after layout, once the checked label has its bold width; no slide on the first render
  useLayoutEffect(() => {
    const label = capsule.current?.querySelector('label:has(>input:checked)')
    setPill((previous) => label ? { x: label.offsetLeft, width: label.offsetWidth, slide: !!previous } : null)
  }, [value, options.length])

  return (
    <div ref={capsule} role='radiogroup' aria-labelledby={labelledBy} sx={Capsule.styles.element}>
      {pill && <span aria-hidden={true} style={{ width: pill.width, transform: `translateX(${pill.x}px)`, transition: pill.slide ? undefined : 'none' }} />}
      {options.map((option) => (
        <label key={option.value} htmlFor={`${name}-${option.value}`} title={option.title}>
          <input
            type='radio'
            id={`${name}-${option.value}`}
            name={name}
            value={option.value}
            checked={value === option.value}
            disabled={option.disabled}
            onChange={() => onChange(option.value)}
          />
          {option.label}
        </label>
      ))}
    </div>
  )
}

Capsule.styles = {
  element: {
    display: 'inline-flex',
    gap: '0.25rem',
    padding: '0.25rem',
    borderRadius: '2em',
    backgroundColor: 'primaryDarkest',
    position: 'relative',
    '>span': {
      position: 'absolute',
      top: '0.25rem',
      bottom: '0.25rem',
      left: '0px',
      borderRadius: '2em',
      backgroundColor: 'primary',
      transition: 'transform 400ms cubic-bezier(0.4, 0, 0.2, 1), width 400ms cubic-bezier(0.4, 0, 0.2, 1)',
      '@media (prefers-reduced-motion: reduce)': {
        transition: 'none',
      },
    },
    '>label': {
      position: 'relative',
      paddingY: '0.375rem',
      paddingX: '1rem',
      borderRadius: '2em',
      fontFamily: 'monospace',
      fontSize: 5,
      color: 'primaryLightest',
      whiteSpace: 'nowrap',
      cursor: 'pointer',
      transition: 'color 400ms cubic-bezier(0.4, 0, 0.2, 1)',
      '>input': {
        position: 'absolute',
        inset: '0px',
        opacity: 0,
        width: '100%',
        height: '100%',
        margin: 12,
        cursor: 'inherit',
      },
      ':has(>input:checked)': {
        color: 'whitePure',
        fontWeight: 'strong',
      },
      ':has(>input:focus-visible)': {
        outline: '2px solid',
        outlineColor: 'whitePure',
        outlineOffset: '-2px',
      },
      ':has(>input:disabled)': {
        cursor: 'default',
      },
      ':has(>input:disabled:not(:checked))': {
        opacity: 0.45,
      },
    },
  },
}
