import { useTitle } from '@sensorr/utils'

const withTitle = (title: string) => (WrappedComponent) => {
  const WithTitle = (props) => {
    useTitle(title)

    return (
      <WrappedComponent {...props} />
    )
  }

  WithTitle.displayName = `withTitle(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return WithTitle
}

export default withTitle
