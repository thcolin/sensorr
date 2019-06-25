import { combineEpics } from 'redux-observable'
import { fromEvent } from 'rxjs'
import { map } from 'rxjs/operators'
import io from 'store/io'

const initial = {
  loading: true,
  entities: {
    // [uuid]: {
    //   file: '[uuid]-[job]',
    //   uuid: 'uuid',
    //   job: 'job',
    // }
  },
}

const AMEND_SESSIONS = 'sensorr/sessions/AMEND_SESSIONS'

export default function (state = initial, action = {}) {
  switch (action.type) {
    case AMEND_SESSIONS:
      return {
        ...state,
        loading: false,
        entities: {
          ...state.entities,
          ...action.sessions,
        }
      }
    default:
      return state
  }
}

export const amendSessions = (sessions) => ({
  type: AMEND_SESSIONS,
  sessions,
})

export const epics = combineEpics(
  listenSessionsEpic,
)

function listenSessionsEpic(action$) {
  return fromEvent(io, 'sessions').pipe(
    map(({ sessions }) => amendSessions(sessions))
  )
}
