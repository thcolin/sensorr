import { policyChangesOf } from './config.service'

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
