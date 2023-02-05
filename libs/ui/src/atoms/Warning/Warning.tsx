import { memo } from 'react'

export interface WarningProps {
  emoji: string
  title: string | React.ReactNode
  subtitle: string | React.ReactNode
  children?: React.ReactNode
}

const UIWarning = ({
  emoji,
  title,
  subtitle,
  children,
  ...props
}: WarningProps) => (
  <div {...props} sx={UIWarning.styles.element}>
    <h1 sx={UIWarning.styles.emoji}>{emoji}</h1>
    <h2 sx={UIWarning.styles.title}>{title}</h2>
    <p sx={UIWarning.styles.subtitle}>{subtitle}</p>
    {children}
  </div>
)

UIWarning.styles = {
  element: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2.5em 2.5em 4.5em 2.5em',
    textAlign: 'center',
  },
  emoji: {
    fontSize: '5em',
    margin: 12,
  },
  title: {
    paddingY: 8,
    margin: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  subtitle: {
    padding: 12,
    margin: 12,
    lineHeight: 'body',
  }
}

export const Warning = memo(UIWarning)
