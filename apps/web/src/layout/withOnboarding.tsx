import { Navigate, useLocation } from 'react-router-dom'
import { useConfigContext } from '../contexts/Config/Config'
import { needsOnboarding } from '../pages/Onboarding/needsOnboarding'

export const withOnboarding = (WrappedComponent, name = '') => {
  const WithOnboarding = (props) => {
    const { config } = useConfigContext()
    const location = useLocation()

    // Only the root, where the login lands: Settings and Jobs stay open while the onboarding is not done
    if (location.pathname === '/' && needsOnboarding(config)) {
      return <Navigate replace={true} to='/onboarding' />
    }

    return <WrappedComponent {...props} />
  }

  WithOnboarding.displayName = `withOnboarding(${name || (WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return WithOnboarding
}

export default withOnboarding
