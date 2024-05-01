import { useEffect } from 'react'
import { useHistoryState } from '@sensorr/utils'

const withPlacehodersHistoryState = (initial = 10000) => (WrappedComponent) => {
  const withPlacehodersHistoryState = (props) => {
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

  withPlacehodersHistoryState.displayName = `withPlacehodersHistoryState(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return withPlacehodersHistoryState
}

export default withPlacehodersHistoryState
