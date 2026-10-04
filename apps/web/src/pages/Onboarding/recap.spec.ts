import { nextRunsOf, statusOf } from './recap'

const configOf = (values) => ({ get: (key) => key.split('.').reduce((value, part) => value?.[part], values) })

describe('nextRunsOf', () => {
  // A Thursday
  const now = new Date(2026, 9, 1, 10, 0)
  const config = configOf({
    jobs: {
      record: { movies: { cron: '0 17 * * *', paused: false }, shows: { cron: '0 9 * * *', paused: true } },
      sync: { movies: { cron: '0 1 * * *', paused: false } },
      shrink: { movies: { cron: '0 5 * * 0', paused: false } },
      refine: { movies: { cron: 'not a cron', paused: false } },
    },
  })

  it('lists the soonest runs, a paused or unreadable job left out', () => {
    expect(nextRunsOf(config, now)).toEqual([
      { name: 'record movies', emoji: '📹', when: 'today at 17:00' },
      { name: 'sync movies', emoji: '🔗', when: 'tomorrow at 01:00' },
      { name: 'shrink movies', emoji: '✂️', when: 'Sunday at 05:00' },
    ])
  })
})

describe('statusOf', () => {
  it('reads what a step left in the config, nothing for an empty one', () => {
    expect(statusOf('indexers', configOf({ znabs: [{}, {}] }))).toBe('2 indexers')
    expect(statusOf('policies', configOf({ policies: [{}] }))).toBe('1 policy')
    expect(statusOf('indexers', configOf({ znabs: [] }))).toBe(null)
    expect(statusOf('plex', configOf({ plex: {} }))).toBe(null)
  })
})
