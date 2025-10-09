import Header from './Header/Header'
import Navigation from './Header/elements/Navigation'
import Body from './Body/Body'

export const withLayout = (Page) => {
  const withLayout = (props) => (
    <div sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Header />
      <Page {...props} />
      <Navigation display='app' />
    </div>
  )

  withLayout.displayName = `withLayout(Outlet)`
  return withLayout
}

export const withBody = ({ overlayScrollbars = false }: { overlayScrollbars: boolean } = { overlayScrollbars: false }) => (WrappedComponent) => {
  const withBody = (props) => (
    <Body overlayScrollbars={overlayScrollbars}>
      <WrappedComponent {...props} />
    </Body>
  )

  withBody.displayName = `withBody(${(WrappedComponent as any).displayName || (WrappedComponent as any).type?.name || 'Component'})`
  return withBody
}

export default withLayout
