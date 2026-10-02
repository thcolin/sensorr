import { TAGS, channelOf } from './update'

describe('channelOf', () => {
  it.each([
    ['dev', 'dev'],
    ['sha-5e2c577', 'dev'],
    ['beta', 'beta'],
    ['1.0.0-beta.1', 'beta'],
    ['latest', 'stable'],
    ['1.0', 'stable'],
    ['1.0.0', 'stable'],
  ])('reads the channel of the "%s" tag as %s', (tag, channel) => {
    expect(channelOf(tag)).toBe(channel)
  })

  it('has no channel outside of Docker, without a tag', () => {
    expect(channelOf(undefined)).toBeNull()
  })

  it('moves each channel to the tag the CI publishes it under', () => {
    expect(TAGS).toEqual({ beta: 'beta', stable: 'latest', dev: 'dev' })
  })
})
