import React from 'react'
import { Switch, Route, Redirect } from 'react-router-dom'
import Movie from 'components/Entity/Movie'
import Person from 'components/Entity/Person'
import Home from 'views/pages/Home'
import Medias from 'views/pages/Medias'
import Library from 'views/pages/Library'
import Discover from 'views/pages/Discover'
import MoviePage from 'views/pages/Movie'
import Collection from 'views/pages/Collection'
import PersonPage from 'views/pages/Person'
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

const Recommendations = ({ ...props }) => (
  <Medias
    {...props}
    title={`Recommendations (${props.match.params.id})`}
    uri={['movie', props.match.params.id, 'recommendations'].join('/')}
  />
)

const Similar = ({ ...props }) => (
  <Medias
    {...props}
    title={`Similar (${props.match.params.id})`}
    uri={['movie', props.match.params.id, 'recommendations'].join('/')}
  />
)

const Trending = ({ ...props }) => (
  <Medias
    {...props}
    title={`Trending ${props.match.params.subject}s of the day`}
    uri={['trending', props.match.params.subject, 'day'].join('/')}
    child={{ movie: Movie, person: Person }[props.match.params.subject]}
    props={{ display: { movie: 'default', person: 'portrait' }[props.match.params.subject] }}
  />
)

const Body = ({ ...props }) => (
  <>
    <div css={styles.element}>
      <Switch>
        <Route path="/" exact component={Home} />
        <Route path="/search/:subject(movie|collection|person)/:query?" exact component={Search} />
        <Route path="/trending/:subject(movie|person)" exact component={Trending} />
        <Route path="/movies" exact component={() => <Redirect to="/movies/library" />} />
        <Route path="/movies/library" exact component={Library} />
        <Route path="/movies/discover" exact component={Discover} />
        <Route path="/movies/calendar/:year/:month" exact component={Calendar} />
        <Route path="/movies/calendar" exact component={() => <Redirect to={`/movies/calendar/${(new Date()).getFullYear()}/${(new Date()).getMonth() + 1}`} />} />
        <Route path="/movies/records/:uuid?" exact component={Records} />
        <Route path="/stars" exact component={() => <Redirect to="/persons/following" />} />
        <Route path="/persons" exact component={() => <Redirect to="/persons/following" />} />
        <Route path="/stars/following" exact component={() => <Redirect to="/persons/following" />} />
        <Route path="/persons/following" exact component={Following} />
        <Route path="/movie/:id(\d+):slug(.*)?/recommendations" exact component={Recommendations} />
        <Route path="/movie/:id(\d+):slug(.*)?/similar" exact component={Similar} />
        <Route path="/movie/:id(\d+):slug(.*)?/:releases(releases)?" exact component={MoviePage} />
        <Route path="/collection/:id" exact component={Collection} />
        <Route path="/star/:id" exact component={({ match: { params: { id } } }) => <Redirect to={`/person/${id}`} />} />
        <Route path="/person/:id(\d+):slug(.*)?" exact component={PersonPage} />
        <Route path="/settings/(plex|downloads|database)?" exact component={Settings} />
        <Route component={Blank} />
      </Switch>
    </div>
  </>
)

export default Body
