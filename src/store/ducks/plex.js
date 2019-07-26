import { combineEpics } from 'redux-observable'
import { fromEvent } from 'rxjs'
import { map } from 'rxjs/operators'
import socket from 'store/socket'

const initial = {
  status: 'unknown',
  err: null,
}

const AMEND_STATUS = 'sensorr/plex/AMEND_STATUS'

export default function (state = initial, action = {}) {
  switch (action.type) {
    case AMEND_STATUS:
      return {
        ...state,
        status: action.status,
        err: action.err,
      }
    default:
      return state
  }
}

export const amendStatus = (status, err = null) => ({
  type: AMEND_STATUS,
  status,
  err,
})

export const epics = combineEpics(
  listenStatusEpic,
)

function listenStatusEpic(action$) {
  return fromEvent(socket, 'plex').pipe(
    map(({ status, err }) => amendStatus(status, err))
  )
}
