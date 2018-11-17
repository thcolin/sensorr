import React from 'react'
import marksy from 'marksy'

export default marksy({
  createElement: React.createElement,
  elements: {
    p: ({ children, context, ...props }) => <span {...props}>{children}</span>,
    codespan: ({ children, ...props }) => <code {...props}>{children}</code>,
    ul: ({ children, ...props }) => children,
    li: ({ children, ...props }) => <span>- {children}</span>,
  },
})
