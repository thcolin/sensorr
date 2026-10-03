import { needsOnboarding } from './needsOnboarding'

const configOf = (values) => ({ get: (key) => key.split('.').reduce((value, part) => value?.[part], values) })
const running = { tmdb: 'key', znabs: [{ name: 'ABN' }], onboarding: { done: false, legacy: false } }

describe('needsOnboarding', () => {
  it('opens on a fresh install, its key set by the installer or not', () => {
    expect(needsOnboarding(configOf({ ...running, znabs: [] }))).toBe(true)
    expect(needsOnboarding(configOf({ ...running, tmdb: 'tmdb-api-key' }))).toBe(true)
    expect(needsOnboarding(configOf({ ...running, tmdb: '' }))).toBe(true)
  })

  it('opens on a config converted from a 0.x, indexers included', () => {
    expect(needsOnboarding(configOf({ ...running, onboarding: { done: false, legacy: true } }))).toBe(true)
  })

  it('leaves a running instance alone, flag or not', () => {
    expect(needsOnboarding(configOf(running))).toBe(false)
    expect(needsOnboarding(configOf({ tmdb: 'key', znabs: [{ name: 'ABN' }] }))).toBe(false)
  })

  it('stays closed once finished or skipped', () => {
    expect(needsOnboarding(configOf({ znabs: [], onboarding: { done: true, legacy: true } }))).toBe(false)
  })
})
