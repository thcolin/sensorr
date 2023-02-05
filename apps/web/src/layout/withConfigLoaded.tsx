import { useConfigContext } from '../contexts/Config/Config'
import Loading from './Loading/Loading'

export const withConfigLoaded = (WrappedComponent, name = '') => {
  const withConfigLoaded = (props) => {
    const { config } = useConfigContext()

    if (!config) {
      return <Loading />
    }

    return <WrappedComponent {...props} />
  }

  withConfigLoaded.displayName = `withConfigLoaded(${name || (WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return withConfigLoaded
}

export default withConfigLoaded
