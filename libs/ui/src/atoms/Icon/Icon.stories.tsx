import { Meta } from '@storybook/react'
import { Icon as UIIcon } from './Icon'

export default { component: UIIcon, title: 'Atoms / Icon' } as Meta

export const Icon = (args: any) => <UIIcon {...args} />

Icon.args = {
  value: 'clear',
  width: '1em',
  height: '1em',
}

export const Clear = () => <Icon width='1em' height='1em' value='clear' />
export const Search = () => <Icon width='1em' height='1em' value='search' />
export const Spinner = () => <Icon width='1em' height='1em' value='spinner' />
