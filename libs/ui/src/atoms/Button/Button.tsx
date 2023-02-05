import { memo } from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'contain' | 'outline'
  color?: 'primary' | 'accent' | 'black' | 'white' | 'error'
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
          borderColor: 'primaryDark',
          backgroundColor: 'primaryDark',
        },
        ':active': {
          borderColor: 'primaryDarker',
          backgroundColor: 'primaryDarker',
        },
        ':disabled': {
          borderColor: 'primaryDarkest',
          backgroundColor: 'primaryDarkest',
        },
      },
      accent: {
        borderColor: 'accent',
        backgroundColor: 'accent',
        color: 'hsl(0, 0%, 100%)',
        ':hover': {
          borderColor: 'accentDark',
          backgroundColor: 'accentDark',
        },
        ':active': {
          borderColor: 'accentDarker',
          backgroundColor: 'accentDarker',
        },
        ':disabled': {
          borderColor: 'accentDarkest',
          backgroundColor: 'accentDarkest',
        },
      },
      error: {
        borderColor: 'error',
        backgroundColor: 'error',
        color: 'hsl(0, 0%, 100%)',
        ':hover': {
          borderColor: 'errorDarker',
          backgroundColor: 'errorDarker',
        },
        ':active': {
          borderColor: 'errorDarkest',
          backgroundColor: 'errorDarkest',
        },
        ':disabled': {
          borderColor: 'accentDarkest',
          backgroundColor: 'accentDarkest',
        },
      },
      black: {
        borderColor: 'hsl(0, 0%, 10%)',
        backgroundColor: 'hsl(0, 0%, 10%)',
        color: 'hsl(0, 0%, 100%)',
        ':hover': {
          borderColor: 'hsl(0, 0%, 5%)',
          backgroundColor: 'hsl(0, 0%, 5%)',
        },
        ':active': {
          borderColor: 'hsl(0, 0%, 0%)',
          backgroundColor: 'hsl(0, 0%, 0%)',
        },
        ':disabled': {
          borderColor: 'hsl(0, 0%, 20%)',
          backgroundColor: 'hsl(0, 0%, 20%)',
        },
      },
      white: {
        borderColor: 'hsl(0, 0%, 100%)',
        backgroundColor: 'hsl(0, 0%, 100%)',
        color: 'primary',
        ':hover': {
          borderColor: 'hsl(0, 0%, 95%)',
          backgroundColor: 'hsl(0, 0%, 95%)',
        },
        ':active': {
          borderColor: 'hsl(0, 0%, 90%)',
          backgroundColor: 'hsl(0, 0%, 90%)',
        },
        ':disabled': {
          borderColor: 'hsl(0, 0%, 80%)',
          backgroundColor: 'hsl(0, 0%, 80%)',
        },
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
          borderColor: 'primaryDark',
          color: 'primaryDark',
        },
        ':active': {
          borderColor: 'primaryDarker',
          color: 'primaryDarker',
        },
        ':disabled': {
          borderColor: 'primaryDarkest',
          color: 'primaryDarkest',
        },
      },
      accent: {
        borderColor: 'accent',
        color: 'accent',
        ':hover': {
          borderColor: 'accentDark',
          color: 'accentDark',
        },
        ':active': {
          borderColor: 'accentDarker',
          color: 'accentDarker',
        },
        ':disabled': {
          borderColor: 'accentDarkest',
          color: 'accentDarkest',
        },
      },
      error: {
        borderColor: 'error',
        color: 'error',
        ':hover': {
          borderColor: 'errorDark',
          color: 'errorDark',
        },
        ':active': {
          borderColor: 'errorDarker',
          color: 'errorDarker',
        },
        ':disabled': {
          borderColor: 'errorDarkest',
          color: 'errorDarkest',
        },
      },
      black: {
        borderColor: 'hsl(0, 0%, 10%)',
        color: 'hsl(0, 0%, 10%)',
        ':hover': {
          borderColor: 'hsl(0, 0%, 5%)',
          color: 'hsl(0, 0%, 5%)',
        },
        ':active': {
          borderColor: 'hsl(0, 0%, 0%)',
          color: 'hsl(0, 0%, 0%)',
        },
        ':disabled': {
          borderColor: 'hsl(0, 0%, 20%)',
          color: 'hsl(0, 0%, 20%)',
        },
      },
      white: {
        borderColor: 'hsl(0, 0%, 100%)',
        color: 'hsl(0, 0%, 100%)',
        ':hover': {
          borderColor: 'hsl(0, 0%, 95%)',
          color: 'hsl(0, 0%, 95%)',
        },
        ':active': {
          borderColor: 'hsl(0, 0%, 90%)',
          color: 'hsl(0, 0%, 90%)',
        },
        ':disabled': {
          borderColor: 'hsl(0, 0%, 80%)',
          color: 'hsl(0, 0%, 80%)',
        },
      },
    }[color],
  }),
}

export const Button = memo(UIButton)
