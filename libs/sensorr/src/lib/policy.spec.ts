import { matchPolicy } from './policy'

describe('matchPolicy', () => {
  const policies = [
    { name: 'MULTi' },
    { name: 'VOF', match: { original_languages: ['fr'] } },
    { name: 'VOST', match: { original_languages: ['ja', 'fr'] } },
  ]

  it('gives the first policy matching the original language', () => {
    expect(matchPolicy({ original_language: 'fr' }, policies)?.name).toBe('VOF')
    expect(matchPolicy({ original_language: 'ja' }, policies)?.name).toBe('VOST')
  })

  it('gives nothing when no policy matches', () => {
    expect(matchPolicy({ original_language: 'en' }, policies)).toBeUndefined()
    expect(matchPolicy({}, policies)).toBeUndefined()
    expect(matchPolicy({ original_language: 'fr' }, [])).toBeUndefined()
  })
})
