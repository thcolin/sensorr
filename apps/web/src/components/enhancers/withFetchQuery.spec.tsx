import { useEffect, useState } from 'react'
import { act, render } from '@testing-library/react'
import withFetchQuery from './withFetchQuery'

jest.mock('react-hot-toast', () => ({ error: jest.fn() }))
// The whole of `@sensorr/ui` reaches ESM that this jest setup leaves untransformed
jest.mock('@sensorr/ui', () => ({ useControlsState: jest.requireActual('../../../../../libs/ui/src/elements/Controls/Controls').useControlsState }))
jest.mock('@dicebear/core', () => ({}))
jest.mock('@dicebear/collection', () => ({}))

const flush = () => act(() => new Promise(resolve => setTimeout(resolve, 0)))
// A new query waits for `nanobounce(0)`, which falls back to 256 ms and can wait twice that
const settle = () => act(() => new Promise(resolve => setTimeout(resolve, 600)))

// Each request waits until the test answers it
let calls = []
const mockTMDB = { fetch: jest.fn((uri, params) => new Promise(resolve => calls.push({ page: params.page, resolve }))) }
const answer = async (page, results, total = 1000) => {
  const call = calls.find(call => call.page === page && !call.done)
  call.done = true
  call.resolve({ results, total_results: total })
  await flush()
}

// 20 movies per page, `known: false` on the ones the filter drops
const movies = (page, unknown = 0) => Array(20).fill(null).map((_, index) => ({ id: page * 100 + index, known: index >= unknown }))

let probe
let setValues

const Grid: any = withFetchQuery(
  { uri: 'discover/movie', filters: { hide_unknown: (value) => value ? (movie) => movie.known : null } },
  1,
  () => mockTMDB as any,
  () => {
    const [values, set] = useState({ hide_unknown: true })
    setValues = set
    return [values, set] as any
  },
)(({ entities, length, onMore, controls }) => {
  probe = { entities, length, onMore, controls }

  useEffect(() => {
    controls.onChange(controls.values, {})
  }, [JSON.stringify(controls.values)])

  return null
})

const want = async (index) => {
  await act(async () => probe.onMore([{ index }]))
  await flush()
}

const ids = () => Object.keys(probe.entities).sort((a, b) => Number(a) - Number(b)).map(index => probe.entities[index].id)

describe('withFetchQuery filters', () => {
  beforeEach(() => {
    calls = []
    mockTMDB.fetch.mockClear()
  })

  it('lays filtered pages end to end and loads the next ones once the grid reaches the end', async () => {
    render(<Grid />)
    await settle()
    await answer(1, movies(1, 5))
    expect(ids()).toHaveLength(15)

    await want(15)
    expect(calls.filter(call => !call.done).map(call => call.page)).toEqual([2, 3, 4, 5, 6])

    await answer(2, movies(2, 20))
    await answer(3, movies(3))
    expect(ids().slice(14, 16)).toEqual([119, 300])
  })

  it('shows a page answered early only once the pages before it are in', async () => {
    render(<Grid />)
    await settle()
    await answer(1, movies(1))
    await want(20)

    await answer(3, movies(3))
    expect(ids()).toHaveLength(20)

    await answer(2, movies(2))
    expect(ids()).toHaveLength(60)
  })

  it('drops a page answered for the query before a toggle', async () => {
    render(<Grid />)
    await settle()
    await answer(1, movies(1, 5))
    await want(15)

    await act(async () => setValues({ hide_unknown: false }))
    await settle()
    await answer(1, movies(1, 5))
    await answer(2, movies(2, 5))
    expect(ids()).toHaveLength(20)
    expect(ids()).toContain(100)
  })

  it('tells the TMDB total until the last page is in, then the movies kept', async () => {
    render(<Grid />)
    await settle()
    await answer(1, movies(1, 5), 40)
    expect(probe.length).toBe(40)

    await want(15)
    await answer(2, movies(2, 5), 40)
    expect(probe.length).toBe(30)
    expect(calls.map(call => call.page)).toEqual([1, 2])
  })
})
