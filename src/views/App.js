import React from 'react'
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom'
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
import Blank from 'views/pages/Blank'

const styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  }
}

export default () => (
  <BrowserRouter>
    <div style={styles.element}>
      <Header />
      <Navigation />
      <Switch>
        <Route path="/" exact component={Trending} />
        <Route path="/movies" exact component={() => <Redirect to="/movies/collection" />} />
        <Route path="/movies/collection" exact component={Collection} />
        <Route path="/movies/search/:query?" exact component={(props) => <Search state="movie" {...props} />} />
        <Route path="/stars" exact component={() => <Redirect to="/stars/upcoming" />} />
        <Route path="/stars/upcoming/:year?" exact component={Upcoming} />
        <Route path="/stars/following" exact component={Following} />
        <Route path="/stars/search/:query?" exact component={(props) => <Search state="person" {...props} />} />
        <Route path="/movie/:id/:releases(releases)?" exact component={Movie} />
        <Route path="/star/:id" exact component={Star} />
        <Route path="/configure/(plex|downloads|database)?" exact component={Configure} />
        <Route path="/logs/:uuid?" exact component={Logs} />
        <Route component={Blank} />
      </Switch>
    </div>
  </BrowserRouter>
)
