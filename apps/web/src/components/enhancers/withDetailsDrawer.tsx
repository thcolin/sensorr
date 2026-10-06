import { MovieProps } from '@sensorr/ui'
import { useDetailsDrawerContext } from '../../contexts/DetailsDrawer/DetailsDrawer'

type withDetailsDrawerProps = MovieProps

const withDetailsDrawer = () => (WrappedComponent) => {
  const WithDetailsDrawer = ({ ...props }: withDetailsDrawerProps) => {
    const { open } = useDetailsDrawerContext()

    return (
      <WrappedComponent {...props} onPress={open} />
    )
  }

  WithDetailsDrawer.displayName = `withDetailsDrawer(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return WithDetailsDrawer
}

export default withDetailsDrawer
