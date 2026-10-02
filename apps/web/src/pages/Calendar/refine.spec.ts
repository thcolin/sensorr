import { departmentsOf, judge, refinementsOf, summarize } from './refine'

const followed = { 1461: { state: 'followed' }, 887: { state: 'followed' }, 2053: { state: 'followed' } }

const details = ({ runtime = 100, types = [3], cast = [], crew = [] }) => ({
  runtime,
  release_dates: { results: [{ iso_3166_1: 'US', release_dates: types.map(type => ({ type })) }] },
  credits: { cast, crew },
})

const defaults = { with_release_type: '3', with_credits_departments: 'Acting|Directing|Writing', with_credits_order: 10, runtime_gte: 40 }

describe('refine', () => {
  it('keeps a followed person who plays a real part in a theatrical release', () => {
    const summary = summarize(details({ types: [1, 3], cast: [{ id: 887, order: 0, character: 'James Belmont' }] }), followed)

    expect(departmentsOf(summary, 10)).toEqual(['Acting'])
    expect(judge(summary, defaults)).toBe(true)
  })

  it('drops a movie where the followed person only produces, until Production is checked', () => {
    const summary = summarize(details({ types: [1, 3], crew: [{ id: 1461, department: 'Production', job: 'Executive Producer' }] }), followed)

    expect(judge(summary, defaults)).toBe(false)
    expect(judge(summary, { ...defaults, with_credits_departments: 'Acting|Production' })).toBe(true)
    expect(judge(summary, { ...defaults, with_credits_departments: '' })).toBe(true)
  })

  it('does not count playing oneself or a part below the tenth billing as acting', () => {
    const self = summarize(details({ cast: [{ id: 2053, order: 0, character: 'Himself' }, { id: 1461, order: 1, character: 'Self (archive footage)' }] }), followed)
    const deep = summarize(details({ cast: [{ id: 887, order: 58, character: '' }] }), followed)

    expect(departmentsOf(self, 10)).toEqual([])
    expect(departmentsOf(deep, 10)).toEqual([])
    expect(judge(self, defaults)).toBe(false)
  })

  it('counts acting down to the billing asked for, or any billing without one', () => {
    const summary = summarize(details({ cast: [{ id: 887, order: 58, character: 'Bartender' }, { id: 1461, order: 12, character: 'Doc' }] }), followed)

    expect(summary.order).toBe(12)
    expect(judge(summary, defaults)).toBe(false)
    expect(judge(summary, { ...defaults, with_credits_order: 20 })).toBe(true)
    expect(judge(summary, { ...defaults, with_credits_order: undefined })).toBe(true)
  })

  it('drops a movie outside the runtime asked for, but keeps an unknown runtime', () => {
    const cast = [{ id: 887, order: 0, character: 'Lightning McQueen' }]

    expect(judge(summarize(details({ runtime: 7, cast }), followed), defaults)).toBe(false)
    expect(judge(summarize(details({ runtime: 7, cast }), followed), { ...defaults, runtime_gte: 0 })).toBe(true)
    expect(judge(summarize(details({ runtime: 0, cast }), followed), defaults)).toBe(true)
    expect(judge(summarize(details({ runtime: 0, cast }), followed), { ...defaults, runtime_gte: 90, runtime_lte: 120 })).toBe(true)
    expect(judge(summarize(details({ runtime: 150, cast }), followed), { ...defaults, runtime_lte: 120 })).toBe(false)
  })

  it('keeps the runtime bounds and the billing out of the TMDB query', () => {
    expect(refinementsOf({ with_genres: '18', 'with_runtime.gte': 40, with_credits_order: 10, with_release_type: '3' })).toEqual([
      { with_genres: '18' },
      { with_release_type: '3', with_credits_departments: undefined, with_credits_order: 10, runtime_gte: 40, runtime_lte: undefined },
    ])
  })

  it('applies the release types on any country, which TMDB ignores along primary_release_date', () => {
    const summary = summarize(details({ types: [1], cast: [{ id: 887, order: 0, character: 'Djo' }] }), followed)

    expect(judge(summary, defaults)).toBe(false)
    expect(judge(summary, { ...defaults, with_release_type: '3|2|1' })).toBe(true)
    expect(judge(summary, { ...defaults, with_release_type: '3,1' })).toBe(false)
    expect(judge(summary, { ...defaults, with_release_type: undefined })).toBe(true)
  })

  it('keeps a movie whose details could not be fetched', () => {
    expect(judge(null, defaults)).toBe(true)
  })
})
