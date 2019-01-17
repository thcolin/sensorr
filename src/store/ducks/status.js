import { combineEpics } from 'redux-observable'
import { fromEvent } from 'rxjs'
import { map } from 'rxjs/operators'
import io from 'store/io'

const initial = {
  // record: false,
}

const AMEND_STATUS = 'sensorr/status/AMEND_STATUS'

export default function (state = initial, action = {}) {
  switch (action.type) {
    case AMEND_STATUS:
      return {
        ...state,
        ...action.status,
      }
    default:
      return state
  }
}

export const amendStatus = (status) => ({
  type: AMEND_STATUS,
  status,
})

export const epics = combineEpics(
  listenStatusEpic,
)

function listenStatusEpic(action$) {
  return fromEvent(io, 'status').pipe(
    map(({ status }) => amendStatus(status))
  )
}
