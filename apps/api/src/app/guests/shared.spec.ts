import { sharedIdsOf, sharedUsersOf } from './shared'

describe('sharedIdsOf', () => {
  it('reads the id of each user, whatever the order of the attributes', () => {
    const xml = '<MediaContainer><User id="12" title="Léa" email="lea@example.com"><Server/></User><User title="Greg" id="34"/><Server id="99"/></MediaContainer>'
    expect([...sharedIdsOf(xml)]).toEqual([12, 34])
  })
})

describe('sharedUsersOf', () => {
  it('reads each user with its XML entities decoded, the username when it has no title', () => {
    const xml = '<MediaContainer><User id="12" title="L&#233;a &amp; Co" username="lea" email="lea@example.com" thumb="https://plex.tv/users/1/avatar?c=2"><Server/></User><User id="34" title="" username="greg" email="greg@example.com"/></MediaContainer>'
    expect(sharedUsersOf(xml)).toEqual([
      { id: 12, name: 'Léa & Co', email: 'lea@example.com', avatar: 'https://plex.tv/users/1/avatar?c=2' },
      { id: 34, name: 'greg', email: 'greg@example.com', avatar: undefined },
    ])
  })
})
