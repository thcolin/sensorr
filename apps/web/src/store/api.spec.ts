import i18n from '@sensorr/i18n'
import { errorOf } from './api'

const refused = (body) => ({ json: async () => body })

describe('errorOf', () => {
  afterEach(() => i18n.changeLanguage('en'))

  it('reads a coded error in the language of the interface', async () => {
    await i18n.changeLanguage('fr')
    expect(await errorOf(refused({ code: 'jobs.migrating', message: 'Sensorr job "migrate" is already running' }))).toBe('Le job Sensorr «\u00a0migrate\u00a0» tourne déjà')
  })

  it('lists the missing Mail settings in that language', async () => {
    await i18n.changeLanguage('fr')
    expect(await errorOf(refused({ code: 'mail.unset', message: 'Mail is not set up', values: { missing: ['host', 'url'] } })))
      .toBe('Les mails ne sont pas configurés, renseignez le serveur SMTP et l’adresse de Sensorr dans les paramètres Mail')
  })

  it('keeps the message of an error without a known code, and gives up on a body that is not JSON', async () => {
    expect(await errorOf(refused({ message: 'Plex said no' }))).toBe('Plex said no')
    expect(await errorOf({ json: async () => { throw new Error('not JSON') } })).toBe(null)
  })
})
