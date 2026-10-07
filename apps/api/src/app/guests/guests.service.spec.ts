import { checkPin, Plex } from '@sensorr/plex'
import { GuestsService } from './guests.service'
import { translatorOf } from '@sensorr/i18n/server'

jest.mock('@sensorr/plex', () => ({ Plex: jest.fn(), createPin: jest.fn(), checkPin: jest.fn() }))
// The schemas and the services only name injection tokens here; loading them pulls modules the API's jest setup cannot compile
jest.mock('../config/config.service', () => ({ ConfigService: class ConfigService {} }))
jest.mock('../mail/mail.service', () => ({ MailService: class MailService {} }))
jest.mock('../wrapped/wrapped.schema', () => ({ Play: class Play {}, Viewer: class Viewer {} }))
jest.mock('./guest.schema', () => ({ Guest: class Guest {} }))

const lean = (value: unknown) => ({ lean: async () => value && JSON.parse(JSON.stringify(value)) })

// Each call reads and writes in one step, as Mongo does for one document
const guestModelOf = (guests: Record<string, any>[]) => {
  const matches = (guest, filter) => Object.entries(filter).every(([key, value]: [string, any]) => value?.$exists === false ? guest[key] === undefined : guest[key] === value)

  return {
    exists: jest.fn(async ({ email }) => guests.some((guest) => guest.email === email) || null),
    findOne: jest.fn(({ email }) => lean(guests.find((guest) => guest.email === email))),
    findOneAndUpdate: jest.fn(({ email }, update) => {
      const guest = guests.find((guest) => guest.email === email)
      const before = guest && { ...guest }
      guest ? Object.assign(guest, update) : guests.push({ email, ...update })
      return lean(before)
    }),
    updateOne: jest.fn(async (filter, update) => {
      const guest = guests.find((guest) => matches(guest, filter))
      guest && Object.assign(guest, update)
      return { modifiedCount: guest ? 1 : 0 }
    }),
  }
}

const serviceOf = (guests: Record<string, any>[]) => {
  const guestModel = guestModelOf(guests)
  const configService = { config: { get: (key: string) => ({ 'guests.public': true })[key] } }
  const mailService = {
    enabled: jest.fn(() => true),
    url: () => 'https://sensorr.example',
    sender: () => 'Thomas',
    t: () => translatorOf({ region: 'en-US' }),
    service: async () => "Living Room's Sensorr",
    send: jest.fn(async () => undefined),
    unsubscribeOf: async () => ({ href: 'u', headers: {} }),
  }
  ;(checkPin as jest.Mock).mockResolvedValue({ status: 'authorized', token: 'new-token' })
  ;(Plex as jest.Mock).mockReturnValue({ query: async () => ({ id: 1, email: 'lea@example.com', thumb: '', title: 'Léa' }) })

  const service = new GuestsService(guestModel as any, {} as any, {} as any, configService as any, {} as any, mailService as any)
  return { service, mailService, guests }
}

const flush = () => new Promise((resolve) => setImmediate(resolve))
const subjectsOf = (mailService) => mailService.send.mock.calls.map(([, mail]) => mail.subject)

describe('GuestsService.checkRegistration', () => {
  it('mails a disconnected friend who links again, once, and resets their reminders', async () => {
    const { service, mailService, guests } = serviceOf([{ email: 'lea@example.com', name: 'Léa', plex_token_valid: false, reconnect_mails: 2, reconnect_mailed_at: 1, welcome_mailed_at: 1 }])

    // Two polls of one PIN answered at once
    await Promise.all([service.checkRegistration(42), service.checkRegistration(42)])
    await flush()

    expect(subjectsOf(mailService)).toEqual(["Your movie wishes reach Living Room's Sensorr again"])
    expect(mailService.enabled).toHaveBeenCalledWith('reconnect')
    expect(guests[0]).toMatchObject({ plex_token_valid: true, reconnect_mails: 0, reconnect_mailed_at: null })
  })

  it('mails a friend who stopped the reminders too, the mail answers what they just did', async () => {
    const { service, mailService } = serviceOf([{ email: 'lea@example.com', name: 'Léa', plex_token_valid: false, mail_unsubscribed: ['reconnect'], welcome_mailed_at: 1 }])

    await service.checkRegistration(42)
    await flush()

    expect(subjectsOf(mailService)).toEqual(["Your movie wishes reach Living Room's Sensorr again"])
  })

  it('welcomes a new friend and sends them no reconnection', async () => {
    const { service, mailService } = serviceOf([])

    await service.checkRegistration(42)
    await flush()

    expect(subjectsOf(mailService)).toEqual(["You're all set"])
  })

  it('sends nothing to a linked friend who links again', async () => {
    const { service, mailService } = serviceOf([{ email: 'lea@example.com', name: 'Léa', plex_token_valid: true, welcome_mailed_at: 1 }])

    await service.checkRegistration(42)
    await flush()

    expect(mailService.send).not.toHaveBeenCalled()
  })

  it('sends nothing when reconnect is off in the Mail settings', async () => {
    const { service, mailService } = serviceOf([{ email: 'lea@example.com', name: 'Léa', plex_token_valid: false, welcome_mailed_at: 1 }])
    mailService.enabled.mockReturnValue(false)

    await service.checkRegistration(42)
    await flush()

    expect(mailService.send).not.toHaveBeenCalled()
  })
})

describe('GuestsService.upsertGuest', () => {
  it('resets the reminders of a token keep-in-touch finds working again, without a mail', async () => {
    const { service, mailService, guests } = serviceOf([{ email: 'lea@example.com', name: 'Léa', plex_token_valid: false, reconnect_mails: 3 }])

    await expect(service.upsertGuest({ email: 'lea@example.com', plex_token_valid: true })).resolves.toMatchObject({ email: 'lea@example.com', reconnect_mails: 0 })
    await flush()

    expect(mailService.send).not.toHaveBeenCalled()
    expect(guests[0].reconnect_mails).toBe(0)
  })
})
