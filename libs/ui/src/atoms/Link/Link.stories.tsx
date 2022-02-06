import { Meta } from '@storybook/react'
import { Link as UILink } from './Link'

export default { component: UILink, title: 'Atoms / Link' } as Meta

export const Link = (args: any) => <UILink {...args} />

Link.args = {
  to: '/',
  children: 'Hello World !',
}
