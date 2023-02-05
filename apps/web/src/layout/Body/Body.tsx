const Body = ({ ...props }) => (
  <div {...props} sx={Body.styles.element}></div>
)

Body.styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    flex: 1,
    backgroundColor: 'grayLightest',
  },
}

export default Body
