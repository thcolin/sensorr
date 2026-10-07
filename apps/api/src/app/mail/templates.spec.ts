import { translatorOf } from '@sensorr/i18n/server'
import { escape, mails, senderOf, unsubscribePage } from './templates'

const t = translatorOf({ region: 'en-US' })

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
      t,
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
    expect(mails.requests({ t, sender: 'Thomas', name: 'Léa', arrivals, unsubscribe: 'u' }).subject).toBe('2 of your requests are ready to watch')
  })

  it('writes every link in the text version too', () => {
    const mail = mails.reconnect({ t, url: 'https://sensorr.example', sender: 'Thomas', service: "Living Room's Sensorr", name: 'Léa', reminder: 2, unsubscribe: 'https://sensorr.example/api/mail/unsubscribe/abc?kind=reconnect' })
    expect(mail.text).toContain('Reconnect Plex: https://sensorr.example/keep-in-touch')
    expect(mail.text).toContain('Stop these reminders: https://sensorr.example/api/mail/unsubscribe/abc?kind=reconnect')
    expect(mail.text).toContain('Reminder 2 of 3.')
    expect(mail.text).not.toContain('<')
  })

  it('dresses the wrapped in the look of the friend, and in the default one for a look it does not know', () => {
    const labo = mails.wrapped({ t, url: 'https://sensorr.example', sender: 'Thomas', name: 'Léa', token: 'abc', year: 2026, look: 'labo' })
    const unknown = mails.wrapped({ t, url: 'https://sensorr.example', sender: 'Thomas', name: 'Léa', token: 'abc', year: 2026, look: 'nope' as any })
    expect(labo.html).toContain('#ffb238')
    expect(unknown.html).toContain('#d1312b')
    expect(labo.html).toContain('from 1 December 2025 to 1 December 2026')
    expect(labo.picto).toBeUndefined()
  })
})

describe('naming', () => {
  it('names the Sensorr that receives the wishes, and the person who sends', () => {
    const service = "Living Room's Sensorr"
    const reconnect = mails.reconnect({ t, url: 'https://sensorr.example', sender: 'Thomas', service, name: 'Léa', reminder: 0, unsubscribe: 'u' })
    expect(reconnect.subject).toBe("Your movie wishes no longer reach Living Room's Sensorr")
    expect(reconnect.text).toContain("Plex disconnected your account from Living Room's Sensorr, so")
    expect(mails.welcome({ t, url: 'https://sensorr.example', sender: 'Thomas', service, name: 'Léa' }).text).toContain("now reaches Living Room's Sensorr.")
    const invitation = mails.invitation({ t, url: 'https://sensorr.example', sender: 'Thomas', service })
    expect(invitation.text).toContain("Living Room's Sensorr gets them for you on Thomas's Plex.")
    expect(invitation.subject).toBe('Thomas invites you to share your movie wishes')
  })
})

describe('mails.reconnected', () => {
  it('says the wishes arrive again, with no unsubscribe link', () => {
    const mail = mails.reconnected({ t, sender: 'Thomas', service: "Living Room's <Sensorr>", name: 'Léa' })
    expect(mail.subject).toBe("Your movie wishes reach Living Room's <Sensorr> again")
    expect(mail.html).toContain('Living Room&#39;s &lt;Sensorr&gt; again.')
    expect(mail.text).toContain('Open my Watchlist: https://app.plex.tv/desktop/#!/watchlist')
    expect(mail.text).not.toContain('unsubscribe')
    expect(mail.picto).toBe('reconnect')
  })
})

describe('mails.wrapped', () => {
  it('says the page is still filling up when sent before the edition closes', () => {
    const open = mails.wrapped({ t, url: 'https://sensorr.example', sender: 'Thomas', name: 'Léa', token: 'abc', year: 2026, look: 'tele', open: true })
    expect(open.subject).toBe('Your 2026 on Plex, so far')
    expect(open.text).toContain('It fills up until 1 December 2026.')
    expect(open.text).not.toContain('once a year')
  })
})

describe('invitation', () => {
  it('greets a friend read from Plex by their name, escaped, and says why they got it', () => {
    const mail = mails.invitation({ t, url: 'https://sensorr.example', sender: 'Thomas', service: "Living Room's Sensorr", name: '<b>Léa</b>' })
    expect(mail.html).toContain('Hi &lt;b&gt;Léa&lt;/b&gt;,')
    expect(mail.text).toContain('because Thomas shares their Plex with you')
  })

  it('says the address was typed when there is no name', () => {
    const mail = mails.invitation({ t, url: 'https://sensorr.example', sender: 'Thomas', service: "Living Room's Sensorr" })
    expect(mail.text).not.toContain('Hi ')
    expect(mail.text).toContain('because Thomas typed your address')
  })
})

describe('text version', () => {
  it('reads the sender as typed, without the HTML entities of the footer', () => {
    const mail = mails.invitation({ t, url: 'https://sensorr.example', sender: "Tom & O'Brien", service: "Tom & O'Brien's Sensorr" })
    expect(mail.text).toContain("Sent by Tom & O'Brien with Sensorr.")
    expect(mail.text).not.toContain('&amp;')
  })
})

describe('links', () => {
  it('turns a stored value that is not a web address into a dead link', () => {
    const mail = mails.requests({ t, sender: 'Thomas', name: 'Léa', unsubscribe: 'javascript:alert(1)', arrivals: [{ title: 'Dune', detail: '2021', href: 'data:text/html,x' }] })
    expect(mail.html).not.toMatch(/href="(javascript|data):/)
  })
})

describe('language', () => {
  it('writes in the language of the TMDB region', () => {
    const fr = translatorOf({ region: 'fr-FR' })
    const mail = mails.requests({ t: fr, sender: 'Thomas', name: 'Léa', arrivals: [{ title: 'Dune', detail: '2021' }, { title: 'Andor', detail: '2025' }], unsubscribe: 'u' })
    expect(mail.subject).toBe('2 de vos demandes sont prêtes à regarder')
    expect(mail.html).toContain('<html lang="fr">')
    expect(mail.text).toContain('Bonjour Léa,')
  })

  it('writes the years of a wrapped as years', () => {
    const mail = mails.wrapped({ t, url: 'https://sensorr.example', sender: 'Thomas', name: 'Léa', token: 'abc', year: 2026, look: 'tele' })
    expect(mail.subject).toBe('Your 2026 on Plex is ready')
    expect(mail.text).toContain('from 1 December 2025 to 1 December 2026')
  })

  it('translates the unsubscribe page', () => {
    expect(unsubscribePage({ t: translatorOf({ region: 'fr-FR' }), kind: 'requests', done: false, found: true })).toContain('le mail hebdomadaire de vos demandes prêtes à regarder')
    expect(unsubscribePage({ t, kind: 'nope', done: false, found: true })).toContain('This link no longer works')
  })
})
