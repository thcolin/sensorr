import React from 'react'
import { withRouter, Switch, Route } from 'react-router-dom'
import Search from 'views/layout/Search'
import Trending from 'views/pages/Trending'
import Collection from 'views/pages/Collection'
import Movie from 'views/pages/Movie'
import Star from 'views/pages/Star'
import Upcoming from 'views/pages/Upcoming'
import Following from 'views/pages/Following'
import Configure from 'views/pages/Configure'
import Records from 'views/pages/Records'
import Blank from 'views/pages/Blank'
import qs from 'query-string'

const styles = {
  hidden: {
    display: 'none',
  },
}

const Body = withRouter(({ location, history, match, staticContext, ...props }) => {
  const { query } = qs.parse(location.search)

  return (
    <>
      <Search.Results />
      <div style={{ ...(query ? styles.hidden : {}) }}>
        <Switch>
          <Route path="/" exact component={Trending} />
          <Route path="/movies/collection" exact component={Collection} />
          <Route path="/movies/upcoming/:year?" exact component={Upcoming} />
          <Route path="/movies/records/:uuid?" exact component={Records} />
          <Route path="/stars/following" exact component={Following} />
          <Route path="/movie/:id/:releases(releases)?" exact component={Movie} />
          <Route path="/star/:id" exact component={Star} />
          <Route path="/configure/(plex|downloads|database)?" exact component={Configure} />
          <Route component={Blank} />
        </Switch>
      </div>
    </>
  )
})

export default Body
