import { arrived, availableOf, labelOf } from './channels'

const BETA = '00459262b2ee61622d0a10ae14a411759bf9d186'
const PUSH = 'aee03699eb374bda8fd350e7193613601406c050'
const NEXT = 'ce861ce0a1b2c3d4e5f60718293a4b5c6d7e8f90'

const channels = {
  stable: { version: null, revision: null },
  beta: { version: '1.0.0-beta.1', revision: BETA },
  dev: { version: 'dev', revision: PUSH },
}

const instance = (tag: string, revision: string, version = '1.0.0-beta.1') => ({ tag, channel: tag === 'latest' ? 'stable' : tag, version, revision, channels })

describe('labelOf', () => {
  it('names a release by its version and a dev build by its short revision', () => {
    expect(labelOf('beta', channels.beta)).toBe('v1.0.0-beta.1')
    expect(labelOf('dev', channels.dev)).toBe('aee0369')
    expect(labelOf('stable', channels.stable)).toBeNull()
  })
})

describe('availableOf', () => {
  it('offers a newer push on dev, told by its revision', () => {
    expect(availableOf(instance('dev', BETA))).toBe('aee0369')
    expect(availableOf(instance('dev', PUSH))).toBeNull()
  })

  it('offers nothing on dev without the revision of the running image', () => {
    expect(availableOf(instance('dev', null))).toBeNull()
  })

  it('offers a newer release on beta, told by its version', () => {
    expect(availableOf(instance('beta', BETA, '1.0.0-beta.0'))).toBe('v1.0.0-beta.1')
    expect(availableOf(instance('beta', BETA))).toBeNull()
  })
})

describe('arrived', () => {
  const towards = (key: string, from) => ({ key, image: channels[key], from })

  it('waits on a switch from dev to beta until the tag moves, the package.json version being the same', () => {
    const wait = towards('beta', instance('dev', PUSH))
    expect(arrived(instance('dev', PUSH), wait)).toBe(false)
    expect(arrived(instance('beta', BETA), wait)).toBe(true)
  })

  it('waits on a switch from beta to dev until the tag moves, the revision being the same', () => {
    const wait = towards('dev', instance('beta', BETA))
    expect(arrived(instance('beta', BETA), wait)).toBe(false)
    expect(arrived(instance('dev', BETA), wait)).toBe(true)
  })

  it('takes any new revision on dev, a push newer than the one announced included', () => {
    const wait = towards('dev', instance('dev', BETA))
    expect(arrived(instance('dev', BETA), wait)).toBe(false)
    expect(arrived(instance('dev', PUSH), wait)).toBe(true)
    expect(arrived(instance('dev', NEXT), wait)).toBe(true)
  })
})
