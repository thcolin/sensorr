import { combineReducers, createStore, compose, applyMiddleware } from 'redux'
import { combineEpics, createEpicMiddleware } from 'redux-observable'
import * as statusDucks from 'store/ducks/status'

const reducers = combineReducers({
  status: statusDucks.default,
})

export const epic = combineEpics(
  statusDucks.epics,
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
