import { useEffect } from 'react'
import { useHistoryState } from '@sensorr/utils'

const withPlacehodersHistoryState = (initial = 10000) => (WrappedComponent) => {
  const WithPlacehodersHistoryState = (props) => {
    const [placeholders, setPlaceholders] = useHistoryState('placeholders', initial)

    useEffect(() => {
      if (!props.length) {
        return
      }

      setPlaceholders(props.length)
    }, [props.length])

    return (
      <WrappedComponent {...props} placeholders={placeholders} />
    )
  }

  WithPlacehodersHistoryState.displayName = `withPlacehodersHistoryState(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return WithPlacehodersHistoryState
}

export default withPlacehodersHistoryState
