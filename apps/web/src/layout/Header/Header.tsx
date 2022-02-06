import { useEffect, useRef, useState } from 'react'
import { Switch, Route, useLocation } from 'react-router-dom'
import { Link } from '@sensorr/ui'
import { scrollToTop } from '@sensorr/utils'
import { useSearchContext } from '../../contexts/Search/Search'
import { useLoadingContext } from '../../contexts/Loading/Loading'
import { Input as SearchInput, Results as SearchResults } from './elements/Search'
import Navigation from './elements/Navigation'

const Logo = ({ ...props }) => (
  <Link {...props} to='/' sx={Logo.styles.element} title='Sensorr'>
    🍿
  </Link>
)

Logo.styles = {
  element: {
    fontSize: 2,
    variant: 'link.reset',
    marginX: 8,
  },
}

const PWD = ({ ...props }) => (
  <button sx={PWD.styles.element} onClick={() => scrollToTop()}>
    <Switch>
      <Route path='/' exact={true} render={() => 'Home'} />
      <Route path='/movie' render={() => 'Movies'} />
      <Route path='/movie/:id' render={() => 'Movies'} />
      <Route path='/person' render={() => 'Stars'} />
      <Route path='/person/:id' render={() => 'Stars'} />
      <Route path='/search/:query' render={() => 'Search'} />
      <Route path='/jobs' render={() => 'Jobs'} />
      <Route path='/settings' render={() => 'Settings'} />
      <Route render={() => 'Navigation'} />
    </Switch>
  </button>
)

PWD.styles = {
  element: {
    position: 'absolute',
    left: '100%',
    variant: 'button.reset',
    fontWeight: 'semibold',
    fontFamily: 'heading',
    fontSize: 5,
    marginLeft: 4,
    marginRight: 4,
  },
}

const Hr = ({ ...props }) => <hr sx={Hr.styles.element} {...props} />

Hr.styles = {
  element: {
    variant: 'hr.reset',
  },
}

const Seperator = ({ ...props }) => <div sx={Seperator.styles.element}></div>

Seperator.styles = {
  element: {
    borderLeft: '1px solid',
    borderColor: 'gray3',
    height: '1em',
  },
}

const LoadingBar = ({ ...props }) => {
  const ready = useRef(false)
  const { timeout, loading } = useLoadingContext() as any
  const [width, setWidth] = useState(loading ? '100%' : '0%')

  useEffect(() => {
    if (!ready.current) {
      ready.current = true
      return
    }

    if (loading) {
      setWidth('95%')
    } else {
      setWidth('101%')
      const timeout = setTimeout(() => setWidth('0%'), 400)
      return () => clearTimeout(timeout)
    }
  }, [loading])

  return (
    <div sx={LoadingBar.styles.element}>
      <div sx={{ backgroundColor: 'rgb(235, 235, 235)' }} />
      <div sx={{ backgroundColor: 'rgb(235, 235, 16)' }} />
      <div sx={{ backgroundColor: 'rgb(16, 235, 235)' }} />
      <div sx={{ backgroundColor: 'rgb(16, 235, 16)' }} />
      <div sx={{ backgroundColor: 'rgb(235, 16, 235)' }} />
      <div sx={{ backgroundColor: 'rgb(235, 16, 16)' }} />
      <div sx={{ backgroundColor: 'rgb(16, 16, 235)' }} />
      <div
        sx={{
          position: 'absolute',
          height: '100%',
          width,
          transition: loading ? `width ${timeout}ms cubic-bezier(0, 0, 0, 1)` : 'width 200ms ease-in-out',
          backgroundColor: 'primary',
        }}
      />
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

const Toolbar = ({ ...props }) => (
  <div sx={Toolbar.styles.element}>
    <LoadingBar />
    <div sx={Toolbar.styles.wrapper}>
      <div sx={Toolbar.styles.left}>
        <Logo />
        <Seperator />
        <PWD />
      </div>
      <div sx={Toolbar.styles.center}>
        <SearchInput />
      </div>
      <div></div>
    </div>
  </div>
)

Toolbar.styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    height: '4em',
  },
  wrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    '>*': {
      paddingRight: 4,
      paddingLeft: 4,
    },
  },
  left: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    '>*:not(:first-child)': {
      display: ['none', 'block'],
    },
  },
  center: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    maxWidth: '40rem',
    marginBottom: '-1px',
    borderBottom: '1px solid',
    borderColor: 'gray2',
    marginX: '10em',
  },
}

const Header = ({ ...props }) => {
  const location = useLocation()
  const { results, loading, clear } = useSearchContext() as any
  const extanded = results !== null || loading

  useEffect(() => {
    if (extanded) {
      clear()
    }
  }, [location])

  useEffect(() => {
    if (extanded) {
      document.body.style['max-height'] = '100vh'
      document.body.style['overflow'] = 'hidden'
    } else {
      document.body.style['max-height'] = 'initial'
      document.body.style['overflow'] = 'initial'
    }
  }, [extanded])

  return (
    <>
      <div sx={{ ...Header.styles.element, height: extanded ? '100vh' : 'initial' }}>
        <Toolbar />
        <SearchResults />
      </div>
      <Navigation />
      <Hr sx={Header.styles.line} />
    </>
  )
}

Header.styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'sticky',
    top: '0px',
    backgroundColor: 'white',
    zIndex: 3,
  },
  line: {
    position: 'sticky',
    top: '4em',
    zIndex: 2,
  },
}

export default Header
