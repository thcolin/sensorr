import { useEffect } from 'react'

// `null` leaves the document title to the page underneath
export const useTitle = (title?: string | false | null) => {
  const value = ['Sensorr', title].filter(part => part).join(' - ')

  useEffect(() => {
    if (title === null) {
      return
    }

    document.title = value
  }, [value, title === null])
}
