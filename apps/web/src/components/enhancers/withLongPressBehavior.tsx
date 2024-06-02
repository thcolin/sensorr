import { MovieProps } from '@sensorr/ui'
import { useDetailsDrawerContext } from '../../contexts/DetailsDrawer/DetailsDrawer'

interface withLongPressBehaviorProps extends MovieProps {}

const withLongPressBehavior = () => (WrappedComponent) => {
  const withLongPressBehavior = ({ ...props }: withLongPressBehaviorProps) => {
    const { open } = useDetailsDrawerContext()

    return (
      <WrappedComponent {...props} onLongPress={open} />
    )
  }

  withLongPressBehavior.displayName = `withLongPressBehavior(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return withLongPressBehavior
}

export default withLongPressBehavior
