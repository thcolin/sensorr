import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { StickyContainer } from 'react-sticky'
import { Provider as LibraryProvider } from 'views/pages/Library'
import { Provider as FollowingProvider } from 'views/pages/Following'
import Header from 'views/layout/Header'
import Navigation from 'views/layout/Navigation'
import Body from 'views/layout/Body'

const styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  }
}

const App = () => {
  return (
    <BrowserRouter>
      <div style={styles.element}>
        <Header />
        <LibraryProvider>
          <FollowingProvider>
            <StickyContainer style={styles.container}>
              <Navigation />
              <Body />
            </StickyContainer>
          </FollowingProvider>
        </LibraryProvider>
      </div>
    </BrowserRouter>
  )
}

export default App
