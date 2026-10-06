import { Button, Warning } from '@sensorr/ui'
import { useConfigContext } from '../contexts/Config/Config'
import Loading from './Loading/Loading'

export const withConfigLoaded = (WrappedComponent, name = '') => {
  const WithConfigLoaded = (props) => {
    const { config, error, retry } = useConfigContext()

    if (error) {
      return (
        <Warning emoji='💢' title='Sorry, unable to load the configuration...' subtitle={error.message}>
          <Button variant='outline' color='gray' onClick={retry}>Retry</Button>
        </Warning>
      )
    }

    if (!config) {
      return <Loading />
    }

    return <WrappedComponent {...props} />
  }

  WithConfigLoaded.displayName = `withConfigLoaded(${name || (WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return WithConfigLoaded
}

export default withConfigLoaded
