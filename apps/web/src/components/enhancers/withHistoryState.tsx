import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const withHistoryState = (initial = 20) => (WrappedComponent) => {
  const withHistoryState = (props) => {
    const navigate = useNavigate()
    const { pathname, state } = useLocation()

    useEffect(() => {
      if (!props.length) {
        return
      }

      navigate(pathname, { replace: true, state: { ...state, total: props.length } })
    }, [props.length, JSON.stringify(state)])

    return (
      <WrappedComponent {...props} placeholders={state?.total || initial} />
    )
  }

  withHistoryState.displayName = `withHistoryState(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return withHistoryState
}

export default withHistoryState
