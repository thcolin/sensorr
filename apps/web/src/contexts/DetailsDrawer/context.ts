import { createContext, useContext } from 'react'

// Apart from the drawer, which imports the pages: the cards those pages draw open it through this hook
export const detailsDrawerContext = createContext({})

export const useDetailsDrawerContext = () => useContext(detailsDrawerContext) as ({
  open: (details: any) => void
  close: () => void
  leave: (from: { key: string, pathname: string }) => void
})
