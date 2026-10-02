import { MovieProps } from '@sensorr/ui'
import { useDetailsDrawerContext } from '../../contexts/DetailsDrawer/DetailsDrawer'

type withLongPressBehaviorProps = MovieProps

const withLongPressBehavior = () => (WrappedComponent) => {
  const WithLongPressBehavior = ({ ...props }: withLongPressBehaviorProps) => {
    const { open } = useDetailsDrawerContext()

    return (
      <WrappedComponent {...props} onLongPress={open} />
    )
  }

  WithLongPressBehavior.displayName = `withLongPressBehavior(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return WithLongPressBehavior
}

export default withLongPressBehavior
