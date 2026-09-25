import { platformsOf } from './platforms'

describe('platformsOf', () => {
  const offer = (provider_id, provider_name) => ({ provider_id, provider_name })

  it('joins the offers of a platform under the one without ads', () => {
    const platforms = platformsOf([offer(1796, 'Netflix Standard with Ads'), offer(337, 'Disney Plus'), offer(8, 'Netflix')])
    expect(platforms.map(offers => offers.map(({ provider_name }) => provider_name))).toEqual([
      ['Netflix', 'Netflix Standard with Ads'],
      ['Disney Plus'],
    ])
  })

  it('keeps apart two platforms whose names only share a start', () => {
    expect(platformsOf([offer(1899, 'Max'), offer(6, 'Maxdome'), offer(1825, 'Max Amazon Channel')])).toHaveLength(2)
  })

  it('lists nothing without providers', () => {
    expect(platformsOf(undefined)).toEqual([])
  })
})
