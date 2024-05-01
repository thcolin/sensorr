import Header from './Header/Header'
import Navigation from './Header/elements/Navigation'
import Body from './Body/Body'

export const withLayout = (Page) => {
  const withLayout = (props) => (
    <div sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Header />
      <Body>
        <Page {...props} />
      </Body>
      <Navigation display='app' />
    </div>
  )

  withLayout.displayName = `withLayout(Outlet)`
  return withLayout
}

export default withLayout
