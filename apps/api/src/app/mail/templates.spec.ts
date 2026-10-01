import { escape, mails, senderOf } from './templates'

describe('senderOf', () => {
  it('reads the name of the sender, quoted or not, else the mailbox', () => {
    expect(senderOf('Thomas <sensorr@example.com>')).toBe('Thomas')
    expect(senderOf('"Thomas Colin" <sensorr@example.com>')).toBe('Thomas Colin')
    expect(senderOf('sensorr@example.com')).toBe('sensorr')
    expect(senderOf('')).toBe('Sensorr')
  })
})

describe('mails', () => {
  it('escapes what a friend or a title brings', () => {
    const mail = mails.requests({
      sender: 'Thomas',
      name: '<script>alert(1)</script>',
      arrivals: [{ title: 'Tom & Jerry "Movie"', detail: '2021', poster: 'https://image.tmdb.org/t/p/w342/a.jpg' }],
      unsubscribe: 'https://sensorr.example/api/mail/unsubscribe/abc?kind=requests',
    })

    expect(mail.html).not.toContain('<script>')
    expect(mail.html).toContain(escape('<script>alert(1)</script>'))
    expect(mail.html).toContain('Tom &amp; Jerry &quot;Movie&quot;')
    expect(mail.subject).toBe('Tom & Jerry "Movie" is ready to watch')
    expect(mail.picto).toBe('requests')
  })

  it('counts the arrivals in the subject once there are several', () => {
    const arrivals = [{ title: 'Dune', detail: '2021' }, { title: 'Andor', detail: 'Season 2, 3 episodes' }]
    expect(mails.requests({ sender: 'Thomas', name: 'Léa', arrivals, unsubscribe: 'u' }).subject).toBe('2 of your requests are ready to watch')
  })

  it('writes every link in the text version too', () => {
    const mail = mails.reconnect({ url: 'https://sensorr.example', sender: 'Thomas', name: 'Léa', reminder: 2, unsubscribe: 'https://sensorr.example/api/mail/unsubscribe/abc?kind=reconnect' })
    expect(mail.text).toContain('Reconnect Plex: https://sensorr.example/keep-in-touch')
    expect(mail.text).toContain('Stop these reminders: https://sensorr.example/api/mail/unsubscribe/abc?kind=reconnect')
    expect(mail.text).toContain('Reminder 2 of 3.')
    expect(mail.text).not.toContain('<')
  })

  it('dresses the wrapped in the look of the friend, and in the default one for a look it does not know', () => {
    const labo = mails.wrapped({ url: 'https://sensorr.example', sender: 'Thomas', name: 'Léa', token: 'abc', year: 2026, look: 'labo' })
    const unknown = mails.wrapped({ url: 'https://sensorr.example', sender: 'Thomas', name: 'Léa', token: 'abc', year: 2026, look: 'nope' as any })
    expect(labo.html).toContain('#ffb238')
    expect(unknown.html).toContain('#d1312b')
    expect(labo.html).toContain('from 1 December 2025 to 1 December 2026')
    expect(labo.picto).toBeUndefined()
  })
})

describe('mails.wrapped', () => {
  it('says the page is still filling up when sent before the edition closes', () => {
    const open = mails.wrapped({ url: 'https://sensorr.example', sender: 'Thomas', name: 'Léa', token: 'abc', year: 2026, look: 'tele', open: true })
    expect(open.subject).toBe('Your 2026 on Plex, so far')
    expect(open.text).toContain('It fills up until 1 December 2026.')
    expect(open.text).not.toContain('once a year')
  })
})

describe('text version', () => {
  it('reads the sender as typed, without the HTML entities of the footer', () => {
    const mail = mails.invitation({ url: 'https://sensorr.example', sender: "Tom & O'Brien" })
    expect(mail.text).toContain("Sent by Tom & O'Brien with Sensorr.")
    expect(mail.text).not.toContain('&amp;')
  })
})

describe('links', () => {
  it('turns a stored value that is not a web address into a dead link', () => {
    const mail = mails.requests({ sender: 'Thomas', name: 'Léa', unsubscribe: 'javascript:alert(1)', arrivals: [{ title: 'Dune', detail: '2021', href: 'data:text/html,x' }] })
    expect(mail.html).not.toMatch(/href="(javascript|data):/)
  })
})
