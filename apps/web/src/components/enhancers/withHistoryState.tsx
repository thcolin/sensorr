import { useEffect } from 'react'
import { useHistory } from 'react-router'

const withHistoryState = (initial = 20) => (WrappedComponent) => {
  const withHistoryState = (props) => {
    const { replace, location: { pathname, state } } = useHistory() as any

    useEffect(() => {
      if (!props.length) {
        return
      }

      replace(pathname, { ...state, total: props.length })
    }, [props.length, JSON.stringify(state)])

    return (
      <WrappedComponent {...props} placeholders={state?.total || initial} />
    )
  }

  withHistoryState.displayName = `withHistoryState(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return withHistoryState
}

export default withHistoryState
