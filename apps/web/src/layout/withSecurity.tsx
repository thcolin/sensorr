import { Navigate } from 'react-router-dom'
import { useAuthContext } from '../contexts/Auth/Auth'

export const withSecurity = (WrappedComponent, name = '') => {
  const withSecurity = (props) => {
    const { authenticated } = useAuthContext()

    if (!authenticated) {
      return <Navigate replace={true} to='/login' />
    }

    return <WrappedComponent {...props} />
  }

  withSecurity.displayName = `withSecurity(${name || (WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return withSecurity
}

export default withSecurity
