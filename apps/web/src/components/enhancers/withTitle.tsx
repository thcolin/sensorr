import { useTitle } from '@sensorr/utils'

const withTitle = (title: string) => (WrappedComponent) => {
  const withTitle = (props) => {
    useTitle(title)

    return (
      <WrappedComponent {...props} />
    )
  }

  withTitle.displayName = `withTitle(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return withTitle
}

export default withTitle
