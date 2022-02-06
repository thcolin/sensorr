import { Meta } from '@storybook/react'
import { Tooltip as UITooltip } from './Tooltip'

export default { component: UITooltip, title: 'Atoms / Tooltip' } as Meta

export const Tooltip = (args: any) => <UITooltip {...args} />

Tooltip.args = {
  title: 'Hello World !',
  subtitle: 'How are you ?',
}
