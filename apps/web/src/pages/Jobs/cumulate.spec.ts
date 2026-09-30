import { cumulate } from './cumulate'

describe('cumulate', () => {
  it('adds up what the runs did and keeps what the newest run found', () => {
    const newest = { shows: 1, releases: 1, treated: 0, imports: { success: 0, pending: 1, links: 0, warning: 0, downloading: ['b'] } }
    const older = { shows: 2, releases: 2, treated: 0, imports: { success: 1, pending: 2, links: 1, warning: 1, downloading: ['a', 'b'] } }

    expect(cumulate(newest, older)).toEqual({ shows: 1, releases: 1, treated: 0, imports: { success: 1, pending: 1, links: 1, warning: 0, downloading: ['b'] } })
  })

  it('keeps a count only an older run carries', () => {
    expect(cumulate({ ignored: 1 }, { ignored: 1, recorded: 2 })).toEqual({ ignored: 1, recorded: 2 })
  })
})
