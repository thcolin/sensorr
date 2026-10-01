const WEEK = 7 * 24 * 60 * 60 * 1000

// The reconnect mail to send to a guest whose token is dead: 0 the first one, then the reminders 1 to 3, a week apart
export const reminderOf = ({ reconnect_mails = 0, reconnect_mailed_at = 0 }: { reconnect_mails?: number, reconnect_mailed_at?: number }, now = Date.now()) => {
  if (reconnect_mails > 3 || now - reconnect_mailed_at < WEEK) {
    return null
  }

  return reconnect_mails
}
