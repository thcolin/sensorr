import { reminderOf } from './reminders'

const DAY = 24 * 60 * 60 * 1000
const now = Date.UTC(2026, 9, 1)

describe('reminderOf', () => {
  it('sends the first mail as soon as the token dies', () => {
    expect(reminderOf({}, now)).toBe(0)
  })

  it('waits a week after the last mail before the next reminder', () => {
    expect(reminderOf({ reconnect_mails: 1, reconnect_mailed_at: now - 6 * DAY }, now)).toBeNull()
    expect(reminderOf({ reconnect_mails: 1, reconnect_mailed_at: now - 7 * DAY }, now)).toBe(1)
  })

  it('stops after the third reminder', () => {
    expect(reminderOf({ reconnect_mails: 3, reconnect_mailed_at: now - 30 * DAY }, now)).toBe(3)
    expect(reminderOf({ reconnect_mails: 4, reconnect_mailed_at: now - 30 * DAY }, now)).toBeNull()
  })
})
