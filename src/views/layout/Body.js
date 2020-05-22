import React from 'react'
import { Switch, Route, Redirect } from 'react-router-dom'
import Home from 'views/pages/Home'
import Library from 'views/pages/Library'
import Discover from 'views/pages/Discover'
import Movie from 'views/pages/Movie'
import Collection from 'views/pages/Collection'
import Star from 'views/pages/Star'
import Calendar from 'views/pages/Calendar'
import Following from 'views/pages/Following'
import Settings from 'views/pages/Settings'
import Records from 'views/pages/Records'
import Search from 'views/pages/Search'
import Blank from 'views/pages/Blank'
import theme from 'theme'

const styles = {
  element: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    backgroundColor: theme.colors.smoke,
  },
}

const Body = ({ ...props }) => (
  <>
    <div css={styles.element}>
      <Switch>
        <Route path="/" exact component={Home} />
        <Route path="/search/:subject(movie|collection|person)/:query?" exact component={Search} />
        <Route path="/movies" exact component={() => <Redirect to="/movies/library" />} />
        <Route path="/movies/library" exact component={Library} />
        <Route path="/movies/discover" exact component={Discover} />
        <Route path="/movies/calendar/:year/:month" exact component={Calendar} />
        <Route path="/movies/calendar" exact component={() => <Redirect to={`/movies/calendar/${(new Date()).getFullYear()}/${(new Date()).getMonth() + 1}`} />} />
        <Route path="/movies/records/:uuid?" exact component={Records} />
        <Route path="/stars" exact component={() => <Redirect to="/stars/following" />} />
        <Route path="/stars/following" exact component={Following} />
        {/* <Route path="/movie/:id/recommendations" exact component={Recommendations} /> */}
        {/* <Route path="/movie/:id/similar" exact component={Similar} /> */}
        <Route path="/movie/:id/:releases(releases)?" exact component={Movie} />
        <Route path="/collection/:id" exact component={Collection} />
        <Route path="/star/:id" exact component={Star} />
        <Route path="/settings/(plex|downloads|database)?" exact component={Settings} />
        <Route component={Blank} />
      </Switch>
    </div>
  </>
)

export default Body
