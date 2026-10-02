import { Navigate } from 'react-router-dom'
import { useAuthContext } from '../contexts/Auth/Auth'

export const withSecurity = (WrappedComponent, name = '') => {
  const WithSecurity = (props) => {
    const { authenticated } = useAuthContext()

    if (!authenticated) {
      return <Navigate replace={true} to='/login' />
    }

    return <WrappedComponent {...props} />
  }

  WithSecurity.displayName = `withSecurity(${name || (WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return WithSecurity
}

export default withSecurity
