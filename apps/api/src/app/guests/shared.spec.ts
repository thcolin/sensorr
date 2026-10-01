import { invitableOf, sharedIdsOf, sharedUsersOf } from './shared'

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

  it('reads an entity out of the Unicode range as a replacement character instead of throwing', () => {
    expect(sharedUsersOf('<User id="1" title="A&#99999999;" email="a@example.com"/>')[0].name).toBe('A\uFFFD')
  })
})

describe('invitableOf', () => {
  const users = [
    { id: 1, name: 'Zoé', email: 'Zoe@Example.com', avatar: 'zoe.png' },
    { id: 2, name: 'Léa', email: 'lea@example.com', avatar: undefined },
    { id: 3, name: 'Greg', email: 'greg@example.com', avatar: undefined },
    { id: 4, name: 'Anna', email: 'anna@example.com', avatar: undefined },
  ]

  it('leaves out the guests and sorts by last play, the never seen last, whatever the case of the addresses', () => {
    const results = invitableOf({
      users,
      guests: ['LEA@example.com'],
      viewers: [{ _id: 10, email: 'zoe@example.com' }, { _id: 30, email: 'greg@example.com' }],
      activity: [{ _id: 10, plays: 4, seen: 100 }, { _id: 30, plays: 12, seen: 200 }],
      invited: { 'zoe@example.com': 5 },
    })

    expect(results).toEqual([
      { name: 'Greg', email: 'greg@example.com', avatar: undefined, plays: 12, seen_at: 200000, invited_at: null },
      { name: 'Zoé', email: 'Zoe@Example.com', avatar: 'zoe.png', plays: 4, seen_at: 100000, invited_at: 5 },
      { name: 'Anna', email: 'anna@example.com', avatar: undefined, plays: 0, seen_at: null, invited_at: null },
    ])
  })

  it('sorts by name without any Tautulli viewer imported, and gives no activity', () => {
    const results = invitableOf({ users, guests: [], viewers: [], activity: [], invited: {} })
    expect(results.map(({ name }) => name)).toEqual(['Anna', 'Greg', 'Léa', 'Zoé'])
    expect(results[0]).not.toHaveProperty('plays')
  })
})
