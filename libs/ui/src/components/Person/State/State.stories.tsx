import { Meta } from '@storybook/react'
import { PersonState as UIState } from './State'

export default { component: UIState, title: 'Components / Person / State' } as Meta

export const State = (args: any) => <UIState {...args} />

State.args = {
  value: 'loading',
  onChange: () => {},
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
      },
    },
  },
  onChange: {
    control: {
      type: null,
    },
  },
}

export const Loading = (args: any) => <State {...args} value='loading' />
export const Ignored = (args: any) => <State {...args} value='ignored' />
export const Followed = (args: any) => <State {...args} value='followed' />
