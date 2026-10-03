import { Navigate } from 'react-router-dom'
import { useConfigContext } from '../contexts/Config/Config'
import { needsOnboarding } from '../pages/Onboarding/needsOnboarding'

export const withOnboarding = (WrappedComponent, name = '') => {
  const WithOnboarding = (props) => {
    const { config } = useConfigContext()

    if (needsOnboarding(config)) {
      return <Navigate replace={true} to='/onboarding' />
    }

    return <WrappedComponent {...props} />
  }

  WithOnboarding.displayName = `withOnboarding(${name || (WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return WithOnboarding
}

export default withOnboarding
