import { languageOf } from './language'
import en from './translations/en'
import fr from './translations/fr'

jest.mock('@sensorr/utils', () => ({ emojize: (emoji, label) => `${emoji} ${label}` }))

const keysOf = (object, prefix = '') => Object.entries(object).flatMap(([key, value]) =>
  value && typeof value === 'object' ? keysOf(value, `${prefix}${key}.`) : [`${prefix}${key}`]
)

describe('translations', () => {
  it('gives French every key English has, and no other', () => {
    expect(keysOf(fr).sort()).toEqual(keysOf(en).sort())
  })
})

describe('languageOf', () => {
  it('takes the first browser language Sensorr speaks', () => {
    expect(languageOf('en-US', ['de-DE', 'fr-FR', 'en-GB'])).toBe('fr')
  })

  it('falls back on the TMDB region when the browser speaks none', () => {
    expect(languageOf('fr-FR', ['de-DE'])).toBe('fr')
  })

  it('falls back on English when neither does', () => {
    expect(languageOf('de-DE', ['es-ES'])).toBe('en')
    expect(languageOf(undefined, [])).toBe('en')
  })
})
