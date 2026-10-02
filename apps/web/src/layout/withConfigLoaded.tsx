import { useConfigContext } from '../contexts/Config/Config'
import Loading from './Loading/Loading'

export const withConfigLoaded = (WrappedComponent, name = '') => {
  const WithConfigLoaded = (props) => {
    const { config } = useConfigContext()

    if (!config) {
      return <Loading />
    }

    return <WrappedComponent {...props} />
  }

  WithConfigLoaded.displayName = `withConfigLoaded(${name || (WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return WithConfigLoaded
}

export default withConfigLoaded
