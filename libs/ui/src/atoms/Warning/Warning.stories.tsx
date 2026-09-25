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

// A subtitle with no break point, such as a request URL, wraps inside the block instead of overflowing it
export const Unbreakable = (args: any) => <UIWarning {...args} emoji='💢' title='Sorry, unable to display episodes...' subtitle={`[API] 401 (): https://localhost:4443/api/episodes?aired_after=2026-09-01&aired_before=2026-09-30&page=1&show=${Array(120).fill(null).map((_, index) => 1000 + index * 37).join('|')}`} />

