import * as Emotion from '@emotion/core'
import marksy from 'marksy'

export default marksy({
  createElement: Emotion.jsx,
  elements: {
    p: ({ children, context, ...props }) => <span {...props}>{children}</span>,
    codespan: ({ children, ...props }) => <code {...props}>{children}</code>,
    ul: ({ children, ...props }) => children,
    li: ({ children, ...props }) => <span>- {children}</span>,
  },
})
