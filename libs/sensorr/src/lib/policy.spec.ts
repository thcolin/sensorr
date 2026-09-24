import { entryPolicy, matchPolicy } from './policy'

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

describe('entryPolicy', () => {
  const policies = [
    { name: 'MULTi' },
    { name: 'VOF', match: { original_languages: ['fr'] } },
  ]
  const movie = { original_language: 'fr' }

  it('gives the matching policy to a movie entering the library', () => {
    expect(entryPolicy(movie, null, policies)?.name).toBe('VOF')
    expect(entryPolicy(movie, { state: 'ignored' }, policies)?.name).toBe('VOF')
  })

  it('leaves a movie already in the library, or with a stored policy, as it is', () => {
    expect(entryPolicy(movie, { state: 'wished' }, policies)).toBeUndefined()
    expect(entryPolicy(movie, { state: 'ignored', policy: 'MULTi' }, policies)).toBeUndefined()
  })
})
