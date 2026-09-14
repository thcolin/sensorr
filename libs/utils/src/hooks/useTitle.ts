import { useEffect } from 'react'

export const useTitle = (title?: string | false) => {
  const value = ['Sensorr', title].filter(part => part).join(' - ')

  useEffect(() => {
    document.title = value
  }, [value])
}
