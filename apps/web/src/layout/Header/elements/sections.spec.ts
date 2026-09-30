import { sectionRootOf } from './sections'

describe('sectionRootOf', () => {
  it('has no root to go back to on a bottom bar target', () => {
    expect(['/', '/movie', '/tv', '/person', '/jobs', '/jobs/aje9hge', '/settings']
      .map((pathname) => sectionRootOf(pathname, 'mobile'))).toEqual(Array(7).fill(null))
  })

  it('goes back to the home of the section a page belongs to', () => {
    expect(sectionRootOf('/movie/library', 'mobile')).toBe('/movie')
    expect(sectionRootOf('/movie/swaps/tt0133093', 'mobile')).toBe('/movie')
    expect(sectionRootOf('/movie/62046', 'mobile')).toBe('/movie')
    expect(sectionRootOf('/movie/62046/similar', 'mobile')).toBe('/movie')
    expect(sectionRootOf('/collection/10', 'mobile')).toBe('/movie')
    expect(sectionRootOf('/tv/calendar', 'mobile')).toBe('/tv')
    expect(sectionRootOf('/tv/108545', 'mobile')).toBe('/tv')
    expect(sectionRootOf('/person/trending', 'mobile')).toBe('/person')
    expect(sectionRootOf('/person/18898', 'mobile')).toBe('/person')
    expect(sectionRootOf('/settings/tmdb', 'mobile')).toBe('/settings')
  })

  it('treats a settings page as a root where the settings menu sits beside it', () => {
    expect(sectionRootOf('/settings/tmdb', 'tablet')).toBeNull()
  })
})
