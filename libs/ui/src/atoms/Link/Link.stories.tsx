import { Link as UILink } from './Link'

export default { component: UILink, title: 'Atoms / Link' }

export const Link = (args: any) => <UILink {...args} />

Link.args = {
  to: '/',
  children: 'Hello World !',
}
