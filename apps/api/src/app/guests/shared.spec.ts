import { sharedIdsOf } from './shared'

describe('sharedIdsOf', () => {
  it('reads the id of each user, whatever the order of the attributes', () => {
    const xml = '<MediaContainer><User id="12" title="Léa" email="lea@example.com"><Server/></User><User title="Greg" id="34"/><Server id="99"/></MediaContainer>'
    expect([...sharedIdsOf(xml)]).toEqual([12, 34])
  })
})
