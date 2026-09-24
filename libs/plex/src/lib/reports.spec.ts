import { parseReport } from './reports'

describe('parseReport', () => {
  it('reads the server and the library key out of the report url', () => {
    expect(parseReport({
      id: 'b6f5c1d2-0000-4000-8000-000000000000',
      message: 'vo manquante',
      url: 'server://c17e95cd787ad46b050ebcff895a4b88d25f2d23/com.plexapp.plugins.library/library/metadata/1005631',
      date: '2024-01-04T10:00:00.000Z',
      user: { username: 'friend' },
    })).toEqual({
      id: 'b6f5c1d2-0000-4000-8000-000000000000',
      message: 'vo manquante',
      date: Date.parse('2024-01-04T10:00:00.000Z'),
      username: 'friend',
      server: 'c17e95cd787ad46b050ebcff895a4b88d25f2d23',
      key: '/library/metadata/1005631',
    })
  })

  it('leaves server and key empty on an url it does not know', () => {
    expect(parseReport({ id: 'x', message: '', url: 'https://example.com', date: '2024-01-04T10:00:00.000Z', user: null }))
      .toMatchObject({ server: null, key: null, username: null })
  })
})
