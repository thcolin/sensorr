// import { useEffect, useRef, useState } from 'react'
// import { useLoadingContext } from '../contexts/Loading/Loading'

export const LoadingBar = ({ ...props }) => {
  // const ready = useRef(false)
  // const { timeout, loading } = useLoadingContext() as any
  // const [width, setWidth] = useState(loading ? '100%' : '0%')

  // useEffect(() => {
  //   if (!ready.current) {
  //     ready.current = true
  //     return
  //   }

  //   if (loading) {
  //     setWidth('95%')
  //   } else {
  //     setWidth('101%')
  //     // const timeout = setTimeout(() => setWidth('0%'), 400)
  //     // return () => clearTimeout(timeout)
  //   }
  // }, [loading])

  return (
    <div sx={LoadingBar.styles.element}>
      <div sx={{ backgroundColor: 'rgb(235, 235, 235)' }} />
      <div sx={{ backgroundColor: 'rgb(235, 235, 16)' }} />
      <div sx={{ backgroundColor: 'rgb(16, 235, 235)' }} />
      <div sx={{ backgroundColor: 'rgb(16, 235, 16)' }} />
      <div sx={{ backgroundColor: 'rgb(235, 16, 235)' }} />
      <div sx={{ backgroundColor: 'rgb(235, 16, 16)' }} />
      <div sx={{ backgroundColor: 'rgb(16, 16, 235)' }} />
      {/* <div
        sx={{
          position: 'absolute',
          height: '100%',
          width,
          transition: loading ? `width ${timeout}ms cubic-bezier(0, 0, 0, 1)` : 'width 200ms ease-in-out',
          backgroundColor: 'primary',
        }}
      /> */}
    </div>
  )
}

LoadingBar.styles = {
  element: {
    position: 'relative',
    display: 'flex',
    height: '2px',
    width: '100%',
    '>*': {
      flex: 1,
    }
  },
}
