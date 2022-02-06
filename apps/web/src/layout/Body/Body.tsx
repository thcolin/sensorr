import Pages from '../../pages'

const Body = ({ ...props }) => (
  <div sx={Body.styles.element}>
    <Pages />
  </div>
)

Body.styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    flex: 1,
    backgroundColor: 'gray0',
  },
}

export default Body
