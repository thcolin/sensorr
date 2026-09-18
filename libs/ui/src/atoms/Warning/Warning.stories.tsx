import { Warning as UIWarning } from './Warning'

export default { component: UIWarning, title: 'Atoms / Warning' }

export const Warning = (args: any) => <UIWarning {...args} />

Warning.args = {
  emoji: '👻',
  title: "Bouhouuu ! I'm the scary empty ghost !",
  subtitle: 'Sorry, no results.',
}

export const Empty = (args: any) => <UIWarning {...args} emoji='👻' title="Bouhouuu ! I'm the scary empty ghost !" subtitle='Sorry, no results.' />
export const Bug = (args: any) => <UIWarning {...args} emoji='🐛' title='Oh ! You came across a bug...' subtitle='Error: [API] "http://localhost:4200/api/movies?page=1": 404 (Not Found)' />

