import { multi, statuses, untouched } from './serialize'

describe('multi', () => {
  it('sends the values of a select as the values of a checkbox', () => {
    expect(multi('networks', { values: [{ value: 49, label: 'HBO' }, { value: 213, label: 'Netflix' }], behavior: 'or' })).toEqual({ networks: '49|213' })
    expect(multi('origin_country', { values: [{ value: 'GB', label: 'United Kingdom' }, { value: 'US', label: 'United States' }], behavior: 'and' })).toEqual({ origin_country: 'GB,US' })
    expect(multi('policy', { values: ['VOF', 'SD+'], behavior: 'or' })).toEqual({ policy: 'VOF|SD+' })
    expect(multi('policy', { values: [], behavior: 'or' })).toEqual({})
  })
})

describe('untouched', () => {
  const seasons = untouched({ initial: [1, 10], serialize: (key, raw) => ({ [`${key}.gte`]: raw[0], [`${key}.lte`]: raw[1] }) })

  it('sends nothing for a range left where it starts', () => {
    expect(seasons.serialize('number_of_seasons', [1, 10])).toEqual({})
    expect(seasons.serialize('number_of_seasons', [1, 3])).toEqual({ 'number_of_seasons.gte': 1, 'number_of_seasons.lte': 3 })
  })
})

describe('statuses', () => {
  it('sends the episode statuses as the status the episodes filter on', () => {
    expect(statuses('episode_status', { values: ['wanted', 'owned'] })).toEqual({ status: 'wanted|owned' })
  })
})
