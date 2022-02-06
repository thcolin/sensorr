import { Meta } from '@storybook/react'
import { State as UIState } from './State'

const options = [
  {
    emoji: '⌛',
    label: 'Loading',
    value: 'loading',
    hide: true,
  },
  {
    emoji: '🔕',
    label: 'Ignored',
    value: 'ignored',
  },
  {
    emoji: '🔔',
    label: 'Followed',
    value: 'followed',
  },
  {
    emoji: '💊',
    label: 'Missing',
    value: 'missing',
    hide: true,
  },
  {
    emoji: '📍',
    label: 'Pinned',
    value: 'pinned',
  },
  {
    emoji: '🍿',
    label: 'Wished',
    value: 'wished',
  },
  {
    emoji: '📼',
    label: 'Archived',
    value: 'archived',
  },
]

export default { component: UIState, title: 'Atoms / State' } as Meta

export const State = (args: any) => <UIState {...args} />

State.args = {
  value: 'loading',
  onChange: () => {},
  options,
  size: 'normal',
  compact: false,
}

State.argTypes = {
  value: {
    control: {
      type: 'select',
      options: {
        loading: 'loading',
        ignored: 'ignored',
        followed: 'followed',
        missing: 'missing',
        pinned: 'pinned',
        wished: 'wished',
        archived: 'archived',
      },
    },
  },
  options: {
    control: {
      type: null,
    },
  },
  onChange: {
    control: {
      type: null,
    },
  },
}

export const Loading = () => <State options={options} value='loading' />
export const MovieIgnored = () => <State options={options} value='ignored' />
export const MovieMissing = () => <State options={options} value='missing' />
export const MoviePinned = () => <State options={options} value='pinned' />
export const MovieWished = () => <State options={options} value='wished' />
export const MovieArchived = () => <State options={options} value='archived' />
export const PersonIgnored = () => <State options={options} value='ignored' />
export const PersonFollowed = () => <State options={options} value='followed' />
