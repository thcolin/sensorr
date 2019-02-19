import React from 'react'
import { Route } from 'react-router-dom'
import Header from 'views/layout/Header'
import Navigation from 'views/layout/Navigation'
import Trending from 'views/pages/Trending'
import Collection from 'views/pages/Collection'
import Search from 'views/pages/Search'
import Movie from 'views/pages/Movie'
import Star from 'views/pages/Star'
import Upcoming from 'views/pages/Upcoming'
import Following from 'views/pages/Following'
import Configure from 'views/pages/Configure'
import Logs from 'views/pages/Logs'

const styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  }
}

export default ({ ...props }) => (
  <div style={styles.element}>
    <Header />
    <Navigation />
    <Route path="/" exact component={Trending} />
    <Route path="/movies/collection" exact component={Collection} />
    <Route path="/movies/search/:query?" exact component={(props) => <Search state="movie" {...props} />} />
    <Route path="/stars/upcoming" exact component={Upcoming} />
    <Route path="/stars/following" exact component={Following} />
    <Route path="/stars/search/:query?" exact component={(props) => <Search state="person" {...props} />} />
    <Route path="/movie/:id" exact component={Movie} />
    <Route path="/star/:id" exact component={Star} />
    <Route path="/configure" exact component={Configure} />
    <Route path="/logs" exact component={Logs} />
  </div>
)
