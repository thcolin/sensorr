import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const loadingContext = createContext({})

export const Provider = ({ ...props }) => {
  const timeout = 20000
  const [queue, setQueue] = useState({})
  const loading = useMemo(() => Object.values(queue).some(bool => bool), [queue])
  const setLoading = useCallback((value, key) => setQueue(queue => ({ ...queue, [key]: value })), [setQueue])

  return (
    <loadingContext.Provider
      {...props}
      value={{
        timeout,
        loading,
        setLoading
      }}
    />
  )
}

export const useLoadingContext = () => useContext(loadingContext)
