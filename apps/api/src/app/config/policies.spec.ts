import { listChangesOf, policyChangesOf } from './config.service'

describe('policyChangesOf', () => {
  it('renames a policy the page renamed, and empties a removed one', () => {
    const { renames } = policyChangesOf([
      { name: 'MULTi', oldName: 'MULTi-VF2', removed: false },
      { name: 'VOF', oldName: 'VOF', removed: true },
    ])

    expect(renames).toEqual([{ oldName: 'MULTi-VF2', newName: 'MULTi' }, { oldName: 'VOF', newName: null }])
  })

  it('never renames a policy the page created, removed or not', () => {
    const { renames, policies } = policyChangesOf([
      { name: 'Light', removed: false },
      { name: 'Draft', removed: true },
      { name: 'VOF', oldName: 'VOF', removed: false },
    ])

    expect(renames).toEqual([])
    expect(policies).toEqual([{ name: 'Light', removed: false }, { name: 'VOF', removed: false }])
  })

  it('leaves a config without policies alone', () => {
    expect(policyChangesOf(undefined)).toEqual({ renames: [], policies: undefined })
  })
})

describe('listChangesOf', () => {
  const previous = [{ id: 'kids', media: 'movie', policy: 'VOF' }, { id: 'big', media: 'movie', policy: null }, { id: 'shows', media: 'tv', policy: 'MULTi-VF2' }]

  it('hands a policy given to a list to its titles, and nothing for a list that keeps its own', () => {
    const { policies } = listChangesOf(previous, [{ id: 'kids', media: 'movie', policy: 'VOF' }, { id: 'big', media: 'movie', policy: '4K' }, { id: 'new', media: 'tv', policy: 'VOF' }, { id: 'shows', media: 'tv', policy: null }])

    expect(policies).toEqual([{ id: 'big', media: 'movie', policy: '4K' }, { id: 'new', media: 'tv', policy: 'VOF' }])
  })

  it('follows a renamed policy without handing it again, and drops a removed one', () => {
    const { lists, policies } = listChangesOf(previous, previous, [{ oldName: 'VOF', newName: 'VF' }, { oldName: 'MULTi-VF2', newName: null }])

    expect(lists.map(({ policy }) => policy)).toEqual(['VF', null, null])
    expect(policies).toEqual([])
  })

  it('leaves the lists alone when none are posted', () => {
    expect(listChangesOf(previous, undefined)).toEqual({ lists: undefined, policies: [] })
  })
})
