import React, { useEffect } from 'react'
import { createBrowserRouter, createRoutesFromElements, RouterProvider, Route, Navigate, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import withSecurity from '../layout/withSecurity'
import withConfigLoaded from '../layout/withConfigLoaded'
import withLayout from '../layout/withLayout'

// import { withSuspenseFallback } from '../components/enhancers/withSuspenseFallback'

// const Home = lazy(() => import('./Home/Home'))
// const Library = lazy(() => import('./Library/Library'))
// const Discover = lazy(() => import('./Discover/Discover'))
// const Calendar = lazy(() => import('./Calendar/Calendar'))
// const Theatres = lazy(() => import('./Theatres/Theatres'))
// const Movie = lazy(() => import('./Movie/Movie'))
// const Followed = lazy(() => import('./Followed/Followed'))
// const Person = lazy(() => import('./Person/Person'))
// const Collection = lazy(() => import('./Collection/Collection'))
// const Jobs = lazy(() => import('./Jobs/Jobs'))
// const TMDBSettings = lazy(() => import('./Settings/TMDB'))
// const DownloadsSettings = lazy(() => import('./Settings/Downloads'))
// const PlexSettings = lazy(() => import('./Settings/Plex'))
// const MobileSettings = lazy(() => import('./Settings/ProgressiveWebApp'))

import Login from './Login/Login'
import KeepInTouch from './KeepInTouch/KeepInTouch'
import Home from './Home/Home'
import Library from './Library/Library'
import Discover from './Discover/Discover'
import Calendar from './Calendar/Calendar'
import Theatres from './Theatres/Theatres'
import Requests from './Requests/Requests'
import Recommendations from './Recommendations/Recommendations'
import Similar from './Similar/Similar'
import Movie from './Movie/Movie'
import Followed from './Followed/Followed'
import Person from './Person/Person'
import Collection from './Collection/Collection'
import Trending from './Trending/Trending'
import Search from './Search/Search'
import Jobs from './Jobs/Jobs'
import Settings from './Settings/Settings'
import TMDBSettings from './Settings/TMDB'
import JobsSettings from './Settings/Jobs'
import BlackholeSettings from './Settings/Blackhole'
import ZnabsSettings from './Settings/Znabs'
import PoliciesSettings from './Settings/Policies'
import FriendsSettings from './Settings/Friends'
import PlexSettings from './Settings/Plex'
import MobileSettings from './Settings/Mobile'
import UpdateSettings from './Settings/Update'
import { useDeviceContext } from '../contexts/Device/Device'
import { Provider as ScrollPositionProvider } from '../contexts/ScrollPosition/ScrollPosition'

const LayoutConfigSecurityContainer = withSecurity(withConfigLoaded(withLayout(Outlet)))

const TrendingMovies = Trending('movies')
const TrendingPersons = Trending('persons')

const SearchMovies = Search('movies')
const SearchPersons = Search('persons')

const SettingsRedirector = ({ ...props }) => {
  const { device } = useDeviceContext()

  if (device === 'mobile') {
    return null
  }

  return (
    <Navigate replace={true} to='tmdb' />
  )
}

const router = createBrowserRouter(createRoutesFromElements(
  <Route element={<ScrollPositionProvider children={<Outlet />} />}>
    <Route path='/login' element={<Login />} />
    <Route path='/keep-in-touch' element={<KeepInTouch />} />
    <Route path='/' element={<LayoutConfigSecurityContainer />}>
      <Route path='' element={<Home />} />
      <Route path='movie' element={<Navigate replace={true} to='/movie/discover' />} />
      <Route path='movie/discover' element={<Discover />} />
      <Route path='movie/trending' element={<TrendingMovies />} />
      <Route path='movie/library' element={<Library />} />
      <Route path='movie/calendar' element={<Calendar />} />
      <Route path='movie/theatres' element={<Theatres />} />
      <Route path='movie/requests' element={<Requests />} />
      <Route path='movie/search' element={<SearchMovies />} />
      <Route path='movie/:id' element={<Movie />} />
      <Route path='movie/:id/recommendations' element={<Recommendations />} />
      <Route path='movie/:id/similar' element={<Similar />} />
      <Route path='person/followed' element={<Followed />} />
      <Route path='person/trending' element={<TrendingPersons />} />
      <Route path='person/search' element={<SearchPersons />} />
      <Route path='person' element={<Navigate replace={true} to='/person/followed' />} />
      <Route path='person/:id' element={<Person />} />
      <Route path='collection/:id' element={<Collection />} />
      <Route path='jobs' element={<Jobs />} />
      <Route path='jobs/:job' element={<Jobs />} />
      <Route path='settings' element={<Settings />}>
        <Route path='' element={<SettingsRedirector />} />
        <Route path='tmdb' element={<TMDBSettings />} />
        <Route path='jobs' element={<JobsSettings />} />
        <Route path='blackhole' element={<BlackholeSettings />} />
        <Route path='indexers' element={<ZnabsSettings />} />
        <Route path='policies' element={<PoliciesSettings />} />
        <Route path='friends' element={<FriendsSettings />} />
        <Route path='plex' element={<PlexSettings />} />
        <Route path='mobile' element={<MobileSettings />} />
        <Route path='update' element={<UpdateSettings />} />
      </Route>
    </Route>
  </Route>
))

const App = ({ ...props }) => {
  const { ready } = useTranslation()

  useEffect(() => {
    if (!ready) {
      return
    }

    const timeout = setTimeout(() => {
      (document.querySelector('#root-loading') as HTMLElement).style.setProperty('opacity', '0');
      document.querySelector('#root-loading').addEventListener('transitionend', () => {
        (document.querySelector('#root-loading') as HTMLElement).style.setProperty('z-index', '-1');
        (document.querySelector('#root-loading') as HTMLElement).remove();
      })
    }, 400)

    return () => clearTimeout(timeout)
  }, [ready])

  return (
    <RouterProvider router={router} />
  )
}

export default App
