import { LIMIT, limited } from './limited'

const flush = () => new Promise(resolve => setTimeout(resolve, 0))

describe('limited', () => {
  it('runs LIMIT tasks at once, the next one asked when one ends, and skips the one of a card gone before its turn', async () => {
    const ends = []
    const started = []
    const task = (name) => () => new Promise<void>(resolve => {
      started.push(name)
      ends.push(resolve)
    })

    const signal = new AbortController().signal
    const first = Array.from({ length: LIMIT }, (_, index) => limited(task(index), signal))
    const gone = new AbortController()
    const skipped = limited(task('gone'), gone.signal)
    const next = limited(task('next'), signal)

    expect(started).toHaveLength(LIMIT)

    gone.abort()
    await expect(skipped).rejects.toBe(gone.signal.reason)

    ends[0]()
    await flush()
    expect(started.slice(LIMIT)).toEqual(['next'])

    ends.forEach(end => end())
    await Promise.all([...first, next])
    expect(started).not.toContain('gone')
  })
})
