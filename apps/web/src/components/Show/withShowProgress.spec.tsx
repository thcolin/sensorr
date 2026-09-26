import { act, render } from '@testing-library/react'
import { withShowProgress } from './withShowProgress'

const mockAPI = {
  query: { shows: { getShowProgress: ({ params, init }) => ({ uri: `shows/${params.id}/progress`, params: {}, init }) } },
  fetch: jest.fn(),
}

const mockTMDB = { fetch: jest.fn() }

jest.mock('../../store/api', () => ({ useAPI: () => mockAPI }))
jest.mock('../../store/tmdb', () => ({ useTMDB: () => mockTMDB }))

const flush = () => act(() => new Promise(resolve => setTimeout(resolve, 0)))

// Each request waits until the test answers it, by its uri
const answers = {}
const deferred = (uri) => new Promise(resolve => answers[uri] = resolve)

// Mounted the way `compose` mounts it, props untyped
const Card: any = withShowProgress()(({ entity }) => <span>{`${entity.id}:${entity.progress ? entity.progress.aired : 'none'}`}</span>)

const tedLasso = (next: string) => ({
  status: 'Returning Series',
  seasons: [{ season_number: 1, episode_count: 10 }],
  last_episode_to_air: { season_number: 1, episode_number: 4 },
  next_episode_to_air: { season_number: 1, episode_number: 5, air_date: next },
})

describe('withShowProgress', () => {
  beforeEach(() => {
    mockAPI.fetch.mockReset().mockImplementation(deferred)
    mockTMDB.fetch.mockReset().mockImplementation(deferred)
  })

  afterEach(() => jest.restoreAllMocks())

  it('never draws the progress of the show a card showed before, when its answer comes after the swap', async () => {
    // A row keys its cards by index: the same card goes from one show to the next
    const { container, rerender } = render(<Card entity={{ id: 101 }} metadata={{ state: 'followed' }} display='poster' />)
    rerender(<Card entity={{ id: 102 }} metadata={{ state: 'followed' }} display='poster' />)

    answers['shows/101/progress']({ owned: 0, aired: 9, next: null, seasons: [] })
    await flush()
    expect(container.textContent).toBe('102:none')

    answers['shows/102/progress']({ owned: 0, aired: 5, next: null, seasons: [] })
    await flush()
    expect(container.textContent).toBe('102:5')
  })

  it('reads the TMDB details of a show again after a day, or once its next episode aired', async () => {
    const now = jest.spyOn(Date, 'now')
    const card = (id: number, at: string) => {
      now.mockReturnValue(new Date(at).getTime())
      return render(<Card entity={{ id }} metadata={{}} display='poster' />)
    }

    const first = card(201, '2026-09-26T12:00:00Z')
    answers['tv/201'](tedLasso('2026-10-10'))
    await flush()
    expect(first.container.textContent).toBe('201:4')
    first.unmount()

    const cached = card(201, '2026-09-27T11:00:00Z')
    await flush()
    expect(cached.container.textContent).toBe('201:4')
    cached.unmount()
    expect(mockTMDB.fetch).toHaveBeenCalledTimes(1)
    card(201, '2026-09-27T13:00:00Z').unmount()
    expect(mockTMDB.fetch).toHaveBeenCalledTimes(2)

    // Its next episode airs within the day
    card(202, '2026-09-28T20:00:00Z').unmount()
    answers['tv/202'](tedLasso('2026-09-29'))
    await flush()
    card(202, '2026-09-28T23:00:00Z').unmount()
    expect(mockTMDB.fetch).toHaveBeenCalledTimes(3)
    card(202, '2026-09-29T01:00:00Z').unmount()
    expect(mockTMDB.fetch).toHaveBeenCalledTimes(4)
  })
})
