import { memo } from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'contain' | 'outline'
  color?: 'primary' | 'accent' | 'black' | 'white'
}

const UIButton = ({
  variant = 'contain',
  color = 'white',
  ...props
}: ButtonProps) => (
  <button {...props} sx={UIButton.styles[variant]({ color })} />
)

UIButton.styles = {
  contain: ({ color, ...props }) => ({
    variant: 'button.default',
    transition: 'background-color 200ms ease',
    ...{
      primary: {
        borderColor: 'primary',
        backgroundColor: 'primary',
        color: 'hsl(0, 0%, 100%)',
        ':hover': {
          borderColor: 'accent',
          backgroundColor: 'accent',
        }
      },
      accent: {
        borderColor: 'accent',
        backgroundColor: 'accent',
        color: 'hsl(0, 0%, 100%)',
        ':hover': {
          borderColor: 'highlight',
          backgroundColor: 'highlight',
        }
      },
      black: {
        borderColor: 'hsl(0, 0%, 10%)',
        backgroundColor: 'hsl(0, 0%, 10%)',
        color: 'hsl(0, 0%, 100%)',
        ':hover': {
          borderColor: 'hsl(0, 0%, 0%)',
          backgroundColor: 'hsl(0, 0%, 0%)',
        }
      },
      white: {
        borderColor: 'hsl(0, 0%, 100%)',
        backgroundColor: 'hsl(0, 0%, 100%)',
        color: 'primary',
        ':hover': {
          borderColor: 'hsl(0, 0%, 95%)',
          backgroundColor: 'hsl(0, 0%, 95%)',
        }
      },
    }[color],
  }),
  outline: ({ color, ...props }) => ({
    variant: 'button.default',
    backgroundColor: 'transparent',
    transition: 'border-color 200ms ease, color 200ms ease',
    ...{
      primary: {
        borderColor: 'primary',
        color: 'primary',
        ':hover': {
          borderColor: 'acent',
          color: 'acent',
        },
      },
      accent: {
        borderColor: 'accent',
        color: 'accent',
        ':hover': {
          borderColor: 'highlight',
          color: 'highlight',
        },
      },
      black: {
        borderColor: 'hsl(0, 0%, 10%)',
        color: 'hsl(0, 0%, 10%)',
        ':hover': {
          borderColor: 'hsl(0, 0%, 0%)',
          color: 'hsl(0, 0%, 0%)',
        },
      },
      white: {
        borderColor: 'hsl(0, 0%, 100%)',
        color: 'hsl(0, 0%, 100%)',
        ':hover': {
          borderColor: 'hsl(0, 0%, 95%)',
          color: 'hsl(0, 0%, 95%)',
        },
      },
    }[color],
  }),
}

export const Button = memo(UIButton)
