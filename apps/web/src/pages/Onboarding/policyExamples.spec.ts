// `@sensorr/utils` reaches `@dicebear/core`, which ships as ESM only
jest.mock('@dicebear/core', () => ({}))
jest.mock('@dicebear/collection', () => ({}))

import { policyExamplesOf } from './policyExamples'

describe('policyExamplesOf', () => {
  it('prefers MULTi then the language of the region, and gives the VO to its original language', () => {
    const [multi, vo] = policyExamplesOf('fr-FR')
    expect(multi.prefer).toEqual({ language: ['MULTi', 'FRENCH'] })
    expect(vo).toMatchObject({ name: '🇫🇷 VO', prefer: { language: ['FRENCH'] }, match: { original_languages: ['fr'] } })
  })

  it('matches the spelling of oleoo, not the one of the languages table', () => {
    expect(policyExamplesOf('it-IT')[0].prefer).toEqual({ language: ['MULTi', 'iTALiAN'] })
  })

  it('keeps only Light and 4K for English, or a language oleoo does not tag', () => {
    expect(policyExamplesOf('en-US').map(({ name }) => name)).toEqual(['Light', '4K'])
    expect(policyExamplesOf('xx-XX').map(({ name }) => name)).toEqual(['Light', '4K'])
  })
})
