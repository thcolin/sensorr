import { createContext, useContext, useState } from 'react'

const expandContext = createContext({})

export const Provider = ({ ...props }) => {
  const [expanded, setExpanded] = useState(false)

  return (
    <expandContext.Provider {...props} value={{ expanded, setExpanded }} />
  )
}

export const useExpandContext = () => useContext(expandContext)
