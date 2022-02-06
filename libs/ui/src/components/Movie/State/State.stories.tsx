import { Meta } from '@storybook/react'
import { MovieState as UIState } from './State'

export default { component: UIState, title: 'Components / Movie / State' } as Meta

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
        missing: 'missing',
        pinned: 'pinned',
        wished: 'wished',
        archived: 'archived',
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
export const Missing = (args: any) => <State {...args} value='missing' />
export const Pinned = (args: any) => <State {...args} value='pinned' />
export const Wished = (args: any) => <State {...args} value='wished' />
export const Archived = (args: any) => <State {...args} value='archived' />
