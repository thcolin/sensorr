import { BadRequestException } from '@nestjs/common'
import { CardsService } from './cards.service'

// Only the share is read here; loading the real service pulls modules the API's jest setup cannot compile
jest.mock('./wrapped.service', () => ({ WrappedService: class WrappedService {} }))
jest.mock('puppeteer-core', () => ({}))

const serviceOf = () => {
  const wrappedService = { share: jest.fn(async () => ({ year: 2025, look: { theme: 'tele', choice: true } })) }
  const service = new CardsService(wrappedService as any)
  // No browser: the page the card would be drawn from is all a test needs, and nothing is written to the cards folder
  const draw = jest.spyOn(service as any, 'draw').mockImplementation(async () => Buffer.from('jpeg'))
  jest.spyOn(service as any, 'keep').mockResolvedValue(undefined)
  return { service, draw, wrappedService }
}

describe('CardsService.card', () => {
  it('refuses a language the wrapped does not speak, before computing the share', async () => {
    const { service, wrappedService } = serviceOf()
    await expect(service.card('token', 'tele', 'summary', 'de')).rejects.toBeInstanceOf(BadRequestException)
    await expect(service.card('token', 'tele', 'summary', undefined as unknown as string)).rejects.toBeInstanceOf(BadRequestException)
    expect(wrappedService.share).not.toHaveBeenCalled()
  })

  it('draws the card in the language the page asked for, each language under its own key', async () => {
    const { service, draw } = serviceOf()
    // Held until the three are asked: a card asked again while it is drawn is drawn once, so two draws mean two keys
    let release = () => undefined as void
    const held = new Promise<void>((resolve) => (release = resolve))
    draw.mockImplementation(async () => held.then(() => Buffer.from('jpeg')))
    const asked = ['fr', 'en', 'en'].map((lang) => service.card('token-lang', 'tele', 'summary', lang))
    await new Promise((resolve) => setTimeout(resolve, 50))
    release()
    await Promise.all(asked)
    expect(draw.mock.calls.map((call) => call[4])).toEqual(['fr', 'en'])
  })
})
