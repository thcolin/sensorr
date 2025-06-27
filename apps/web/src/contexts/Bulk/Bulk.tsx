import { createContext, Dispatch, SetStateAction, useContext, useState } from 'react'

const bulkContext = createContext({})

export const Provider = ({ children = null, ...props }) => {
  const [selection, setSelection] = useState({})

  return (
    <bulkContext.Provider {...props} value={{ selection, setSelection }}>
      {children}
    </bulkContext.Provider>
  )
}

export const useBulkContext = () => useContext(bulkContext) as {
  selection: { [key: string]: string[] }
  setSelection: Dispatch<SetStateAction<{ [key: string]: string[] }>>
}
