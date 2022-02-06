import { Meta } from '@storybook/react'
import { Warning } from '../../atoms/Warning/Warning'
import { Movie } from '../../components/Movie/Movie'
import { Person } from '../../components/Person/Person'
import { Grid as UIGrid } from './Grid'
import { fixtures } from '@sensorr/tmdb'

const render = {
  'Movie Poster': ({ index, ...props }) => <Movie {...props} entity={fixtures.movie} state="wished" />,
  'Person Poster': ({ index, ...props }) => <Person {...props} entity={fixtures.person} state="ignored" />,
}

const override = {
  none: null,
  error: <Warning emoji='🐛' title='Oh ! You came across a bug...' subtitle='Error: [API] "http://localhost:4200/api/movies?page=1": 404 (Not Found)' />,
}

export default { component: UIGrid, title: 'Elements / Grid' } as Meta

export const Grid = (args: any) => (
  <div style={{ width: '100%' }}>
    <UIGrid {...args} />
  </div>
)

Grid.args = {
  length: 100,
  render: render['Movie Poster'],
}

Grid.argTypes = {
  render: {
    control: {
      type: 'select',
      options: render,
    },
  },
  override: {
    control: {
      type: 'select',
      options: override,
    },
  },
}
