import { lockOf } from './lock'

describe('lockOf', () => {
  it('refuses a command while its lock is active, and gives it again once released', () => {
    const running = new Set<string>()
    const release = lockOf(running, 'record show')

    expect(release).toBeInstanceOf(Function)
    expect(lockOf(running, 'record show')).toBeNull()
    expect(lockOf(running, 'record movie')).toBeInstanceOf(Function)

    release()
    release()
    expect(running.has('record movie')).toBe(true)
    expect(lockOf(running, 'record show')).toBeInstanceOf(Function)
  })
})
