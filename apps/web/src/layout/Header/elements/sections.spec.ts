import { sectionRootOf } from './sections'

describe('sectionRootOf', () => {
  it('has no root to go back to on a bottom bar target or one of its secondary tabs', () => {
    expect(['/', '/movie/library', '/movie/discover', '/movie/swaps', '/movie/swaps/tt0133093', '/tv/calendar', '/person/trending', '/jobs', '/jobs/aje9hge', '/settings']
      .map((pathname) => sectionRootOf(pathname, 'mobile'))).toEqual(Array(10).fill(null))
  })

  it('goes back to the bottom bar target of the section a sub-level belongs to', () => {
    expect(sectionRootOf('/movie/62046', 'mobile')).toBe('/')
    expect(sectionRootOf('/movie/62046/similar', 'mobile')).toBe('/')
    expect(sectionRootOf('/collection/10', 'mobile')).toBe('/')
    expect(sectionRootOf('/movie/search', 'mobile')).toBe('/')
    expect(sectionRootOf('/tv/108545', 'mobile')).toBe('/tv/library')
    expect(sectionRootOf('/tv/search', 'mobile')).toBe('/tv/library')
    expect(sectionRootOf('/person/18898', 'mobile')).toBe('/person/followed')
    expect(sectionRootOf('/settings/tmdb', 'mobile')).toBe('/settings')
  })

  it('treats a settings page as a root where the settings menu sits beside it', () => {
    expect(sectionRootOf('/settings/tmdb', 'tablet')).toBeNull()
  })
})
