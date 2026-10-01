import { commandTabsOf } from './CommandTabs'

// The barrel reaches ESM packages jest leaves untransformed, and the tabs need none of it
jest.mock('@sensorr/utils', () => ({ glide: jest.fn(), useDragScroll: jest.fn() }))

const COMMANDS = {
  'record movies': { emoji: '📹' },
  'sync movies': { emoji: '💊', label: 'missing' },
  'record shows': { emoji: '📹' },
}

const item = (command: string, type: string, time: number) => ({ meta: { command, type }, time })
const timeOf = ({ time }) => time

describe('commandTabsOf', () => {
  const items = [item('record', 'movie', 1), item('sync', 'movie', 3), item('record', 'movie', 2)]

  it('lists the commands met, counted, the one met last first', () => {
    expect(commandTabsOf(items, COMMANDS, null, timeOf)).toEqual([
      { value: 'sync movies', emoji: '💊', label: 'missing', count: 1 },
      { value: 'record movies', emoji: '📹', count: 2 },
    ])
  })

  it('keeps the picked command when nothing matches it anymore', () => {
    expect(commandTabsOf(items, COMMANDS, 'record shows', timeOf).map(({ value, count }) => [value, count])).toContainEqual(['record shows', 0])
  })

  it('puts a running command before the one met last', () => {
    expect(commandTabsOf(items, COMMANDS, null, timeOf, name => name === 'record movies')[0].value).toBe('record movies')
  })
})
