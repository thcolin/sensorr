import { combineEpics } from 'redux-observable'
import { fromEvent } from 'rxjs'
import { map } from 'rxjs/operators'
import io from 'store/io'

const initial = {
  // record: false,
}

const AMEND_JOBS = 'sensorr/jobs/AMEND_JOBS'

export default function (state = initial, action = {}) {
  switch (action.type) {
    case AMEND_JOBS:
      return {
        ...state,
        ...action.jobs,
      }
    default:
      return state
  }
}

export const amendJobs = (jobs) => ({
  type: AMEND_JOBS,
  jobs,
})

export const epics = combineEpics(
  listenJobsEpic,
)

function listenJobsEpic(action$) {
  return fromEvent(io, 'jobs').pipe(
    map(({ jobs }) => amendJobs(jobs))
  )
}
