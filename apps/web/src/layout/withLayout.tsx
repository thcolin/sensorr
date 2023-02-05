import Header from './Header/Header'
import Body from './Body/Body'

export const withLayout = (Page, name = '') => {
  const withLayout = (props) => (
    <>
      <Header />
      <Body>
        <Page {...props} />
      </Body>
    </>
  )

  withLayout.displayName = `withLayout(${name || (Page as any).displayName || (Page as any).type?.name || 'Component'})`
  return withLayout
}

export default withLayout
