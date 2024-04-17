import { useDeviceContext } from '../../contexts/Device/Device'

const Body = ({ ...props }) => {
  const { pwa } = useDeviceContext()

  return (
    <div
      {...props}
      sx={{
        ...Body.styles.element,
        ...(pwa ? {
          marginTop: ['4em', 12],
          marginBottom: ['calc(max(1em, env(safe-area-inset-bottom)) + 2.625em)', 12],
        } : {}),
      }}
    ></div>
  )
}

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
