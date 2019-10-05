import React from 'react'
import Header from 'views/layout/Header'
import Body from 'views/layout/Body'

const styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
}

const App = () => {
  return (
    <div css={styles.element}>
      <Header />
      <Body />
    </div>
  )
}

export default App
