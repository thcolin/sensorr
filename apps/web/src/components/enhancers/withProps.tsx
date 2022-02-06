export const withProps = <I,>(inject: I) => <P,>(WrappedComponent: React.ComponentType<P>) => {
  const withProps = (props: Omit<P, keyof I>) => (
    <WrappedComponent {...(props as P)} {...inject} />
  )

  withProps.displayName = `withProps(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return withProps
}

export default withProps
