import { Tooltip as UITooltip } from './Tooltip'

export default { component: UITooltip, title: 'Atoms / Tooltip' }

export const Tooltip = (args: any) => <UITooltip {...args} />

Tooltip.args = {
  title: 'Hello World !',
  subtitle: 'How are you ?',
}
