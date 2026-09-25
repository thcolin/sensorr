import React from 'react'
import { act, cleanup, render } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { historyEntryOf, useHistoryState } from './useHistoryState'

let current = null

const Probe = () => {
  const [value, setValue] = useHistoryState('controls', 'initial')
  current = { value, setValue, navigate: useNavigate() }
  return null
}

// A MemoryRouter gives its first entry the `default` key, as a full page load does
const load = (pathname) => {
  cleanup()
  render(<MemoryRouter initialEntries={[pathname]}><Probe /></MemoryRouter>)
}

describe('historyEntryOf', () => {
  it('names an entry by its key, or by its pathname when the key is default', () => {
    expect(historyEntryOf({ key: 'amjayxsh', pathname: '/tv/library' })).toBe('amjayxsh')
    expect(historyEntryOf({ key: 'default', pathname: '/tv/library' })).toBe('/tv/library')
  })
})

describe('useHistoryState', () => {
  beforeEach(() => sessionStorage.clear())

  it('keeps the state of a page loaded in full away from another page loaded in full', () => {
    load('/movie/library')
    act(() => current.setValue('movies'))
    expect(current.value).toBe('movies')

    load('/tv/library')
    expect(current.value).toBe('initial')

    load('/movie/library')
    expect(current.value).toBe('movies')
  })

  it('gives the state of an entry back on a back navigation', () => {
    load('/movie/library')
    act(() => current.setValue('movies'))
    act(() => current.navigate('/tv/library'))
    expect(current.value).toBe('initial')

    act(() => current.setValue('shows'))
    act(() => current.navigate(-1))
    expect(current.value).toBe('movies')

    act(() => current.navigate(1))
    expect(current.value).toBe('shows')
  })
})
