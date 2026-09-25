import { isJob, jobNameOf } from './jobs'

describe('isJob', () => {
  it('takes a job about one media type with a type it handles, and keep-in-touch without one', () => {
    expect(isJob('record', 'shows')).toBe(true)
    expect(isJob('refine', 'movies')).toBe(true)
    expect(isJob('keep-in-touch')).toBe(true)
  })

  it('refuses a type the job does not handle, a missing type, and the old names', () => {
    expect(isJob('refine', 'shows')).toBe(false)
    expect(isJob('record')).toBe(false)
    expect(isJob('keep-in-touch', 'movies')).toBe(false)
    expect(isJob('record-shows')).toBe(false)
    expect(isJob('migrate')).toBe(false)
  })

  it('refuses what JOBS only holds through its prototype, and a command that is not a string', () => {
    for (const command of ['toString', 'valueOf', '__proto__', 'constructor', 'hasOwnProperty']) {
      expect(isJob(command)).toBe(false)
      expect(isJob(command, 'movies')).toBe(false)
    }

    expect(isJob(['record'], 'movies')).toBe(false)
    expect(jobNameOf({ command: 'constructor' })).toBe('constructor')
  })
})

describe('jobNameOf', () => {
  it('names a job by its command and type', () => {
    expect(jobNameOf({ command: 'record', type: 'show' })).toBe('record shows')
    expect(jobNameOf({ command: 'sync', type: 'movie' })).toBe('sync movies')
    expect(jobNameOf({ command: 'keep-in-touch', type: 'show' })).toBe('keep-in-touch')
  })

  it('names a line logged before jobs took a type as a movie one, and a person refreshed as refresh movies', () => {
    expect(jobNameOf({ command: 'record' })).toBe('record movies')
    expect(jobNameOf({ command: 'refresh', type: 'person' })).toBe('refresh movies')
  })

  it('tells the two migrate commands apart', () => {
    expect(jobNameOf({ command: 'migrate' })).toBe('migrate')
    expect(jobNameOf({ command: 'migrate', type: 'show' })).toBe('migrate sonarr')
  })
})
