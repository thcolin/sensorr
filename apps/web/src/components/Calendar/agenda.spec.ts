import { dateOf, monthRange, monthWeeks, originOf, withToday } from './agenda'

const days = (...keys: string[]) => keys.map(key => ({ key, date: dateOf(key), entries: [{}] }))

describe('calendar agenda', () => {
  it('lays a month out in whole weeks from Monday, with the days of the months around it', () => {
    const weeks = monthWeeks(new Date(2026, 8, 1))

    expect(weeks).toHaveLength(5)
    expect(weeks.every(week => week.length === 7)).toBe(true)
    expect(weeks[0].map(({ key }) => key)).toEqual(['2026-08-31', '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05', '2026-09-06'])
    expect(weeks[0][0].outside).toBe(true)
    expect(weeks[0][1].outside).toBe(false)
    expect(weeks[4].map(({ key, outside }) => [key, outside])).toEqual([
      ['2026-09-28', false], ['2026-09-29', false], ['2026-09-30', false],
      ['2026-10-01', true], ['2026-10-02', true], ['2026-10-03', true], ['2026-10-04', true],
    ])
  })

  it('needs six weeks for a month that starts on a Sunday, and four for a February that starts on a Monday', () => {
    expect(monthWeeks(new Date(2026, 10, 1))).toHaveLength(6)
    expect(monthWeeks(new Date(2027, 1, 1))).toHaveLength(4)
    expect(monthWeeks(new Date(2027, 1, 1))[0][0].key).toBe('2027-02-01')
  })

  it('bounds a month on its first and last day', () => {
    expect(monthRange(new Date(2026, 1, 14))).toEqual(['2026-02-01', '2026-02-28'])
    expect(monthRange(new Date(2026, 11, 31))).toEqual(['2026-12-01', '2026-12-31'])
  })

  it('opens a list on today in the current month, and on the first day of any other', () => {
    expect(originOf(new Date(2026, 8, 1), '2026-09-25')).toBe('2026-09-25')
    expect(originOf(new Date(2025, 2, 2), '2026-09-25')).toBe('2025-03-01')
    expect(originOf(undefined, '2026-09-25')).toBe('2026-09-25')
  })

  describe('withToday', () => {
    const open = { past: { done: false }, future: { done: false } }

    it('adds today between the days around it when nothing happens on it', () => {
      expect(withToday(days('2026-09-22', '2026-09-29'), '2026-09-25', '2026-09-25', open).map(({ key, entries }) => [key, entries.length])).toEqual([
        ['2026-09-22', 1],
        ['2026-09-25', 0],
        ['2026-09-29', 1],
      ])
    })

    it('leaves today out of a list opened on a month it has not loaded yet', () => {
      expect(withToday(days('2025-02-20', '2025-03-04'), '2026-09-25', '2025-03-01', open).map(({ key }) => key)).toEqual(['2025-02-20', '2025-03-04'])
    })

    it('adds today past the last day once the stream that leads to it is done', () => {
      expect(withToday(days('2025-02-20', '2025-03-04'), '2026-09-25', '2025-03-01', { past: { done: false }, future: { done: true } }).map(({ key }) => key)).toEqual(['2025-02-20', '2025-03-04', '2026-09-25'])
    })

    it('does not add today twice', () => {
      expect(withToday(days('2026-09-25'), '2026-09-25', '2026-09-25', open)).toHaveLength(1)
    })
  })
})
