import React from 'react'
import { withRouter, Switch, Route, Redirect } from 'react-router-dom'
import Search from 'views/layout/Search'
import Trending from 'views/pages/Trending'
import Library from 'views/pages/Library'
import Movie from 'views/pages/Movie'
import Collection from 'views/pages/Collection'
import Star from 'views/pages/Star'
import Upcoming from 'views/pages/Upcoming'
import Following from 'views/pages/Following'
import Settings from 'views/pages/Settings'
import Records from 'views/pages/Records'
import Blank from 'views/pages/Blank'
import qs from 'query-string'
import theme from 'theme'

const styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    backgroundColor: theme.colors.smoke,
  },
  hidden: {
    display: 'none',
  },
}

const Body = withRouter(({ location, history, match, staticContext, ...props }) => {
  const { query } = qs.parse(location.search)

  return (
    <>
      {!!query && (
        <div css={styles.element}>
          <Search.Results />
        </div>
      )}
      <div css={[styles.element, query && styles.hidden]}>
        <Switch>
          <Route path="/" exact component={Trending} />
          <Route path="/movies" exact component={() => <Redirect to="/movies/library" />} />
          <Route path="/movies/library" exact component={Library} />
          <Route path="/movies/upcoming/:year/:month" exact component={Upcoming} />
          <Route path="/movies/upcoming" exact component={() => <Redirect to={`/movies/upcoming/${(new Date()).getFullYear()}/${(new Date()).getMonth() + 1}`} />} />
          <Route path="/movies/records/:uuid?" exact component={Records} />
          <Route path="/stars" exact component={() => <Redirect to="/stars/following" />} />
          <Route path="/stars/following" exact component={Following} />
          <Route path="/movie/:id/:releases(releases)?" exact component={Movie} />
          <Route path="/collection/:id" exact component={Collection} />
          <Route path="/star/:id" exact component={Star} />
          <Route path="/settings/(plex|downloads|database)?" exact component={Settings} />
          <Route component={Blank} />
        </Switch>
      </div>
    </>
  )
})

export default Body
