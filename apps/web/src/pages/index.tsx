import { lazy } from 'react'
import { Switch, Route, Redirect } from 'react-router-dom'
import { withSuspenseFallback } from '../components/enhancers/withSuspenseFallback'

const Home = lazy(() => import('./Home/Home'))
const Library = lazy(() => import('./Library/Library'))
const Discover = lazy(() => import('./Discover/Discover'))
const Calendar = lazy(() => import('./Calendar/Calendar'))
const Theatres = lazy(() => import('./Theatres/Theatres'))
const Movie = lazy(() => import('./Movie/Movie'))
const Followed = lazy(() => import('./Followed/Followed'))
const Person = lazy(() => import('./Person/Person'))
const Collection = lazy(() => import('./Collection/Collection'))
const Jobs = lazy(() => import('./Jobs/Jobs'))
const Plex = lazy(() => import('./Settings/Plex'))
const ProgressiveWebApp = lazy(() => import('./Settings/ProgressiveWebApp'))

const Pages = ({ ...props }) => (
  <Switch>
    <Route path='/' exact component={withSuspenseFallback(Home, 'Home')} />
    <Route path='/movie' exact component={() => <Redirect to='/movie/discover' />} />
    <Route path='/movie/discover' exact component={withSuspenseFallback(Discover, 'Discover')} />
    <Route path='/movie/library' exact component={withSuspenseFallback(Library, 'Library')} />
    <Route path='/movie/theatres' exact component={withSuspenseFallback(Theatres, 'Theatres')} />
    <Route path='/movie/calendar' exact component={withSuspenseFallback(Calendar, 'Calendar')} />
    <Route path='/movie/:id' exact component={withSuspenseFallback(Movie, 'Movie')} />
    <Route path='/person/followed' exact component={withSuspenseFallback(Followed, 'Followed')} />
    <Route path='/person/:id' exact component={withSuspenseFallback(Person, 'Person')} />
    <Route path='/collection/:id' exact component={withSuspenseFallback(Collection, 'Collection')} />
    <Route path='/jobs' exact component={withSuspenseFallback(Jobs, 'Jobs')} />
    <Route path='/jobs/:job' exact component={withSuspenseFallback(Jobs, 'Jobs')} />
    <Route path='/settings/plex' exact component={withSuspenseFallback(Plex, 'Plex')} />
    <Route path='/settings/pwa' exact component={withSuspenseFallback(ProgressiveWebApp, 'ProgressiveWebApp')} />
  </Switch>
)

export default Pages
