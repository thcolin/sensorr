import { combineReducers, createStore, compose, applyMiddleware } from 'redux'
import { combineEpics, createEpicMiddleware } from 'redux-observable'
import * as jobsDuck from 'store/ducks/jobs'
import * as plexDuck from 'store/ducks/plex'
import * as sessionsDuck from 'store/ducks/sessions'

const reducers = combineReducers({
  jobs: jobsDuck.default,
  plex: plexDuck.default,
  sessions: sessionsDuck.default,
})

export const epic = combineEpics(
  jobsDuck.epics,
  plexDuck.epics,
  sessionsDuck.epics,
)

const epicMiddleware = createEpicMiddleware()
const middleware = ((process.env.NODE_ENV !== 'production' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose)(
  applyMiddleware(epicMiddleware),
)

const store = createStore(
  reducers,
  middleware,
)

epicMiddleware.run(epic)

export default store
