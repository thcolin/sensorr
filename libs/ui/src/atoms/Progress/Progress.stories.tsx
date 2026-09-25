import { Progress as UIProgress } from './Progress'

export default { component: UIProgress, title: 'Atoms / Progress' }

export const Progress = (args: any) => <div sx={{ width: '12.5em' }}><UIProgress {...args} /></div>

Progress.args = {
  value: 17,
  max: 24,
}

export const Empty = () => <Progress value={0} max={24} />
export const Complete = () => <Progress value={236} max={236} />
export const Longest = () => <Progress value={912} max={1454} />
export const NotAired = () => <Progress value={0} max={0} />
export const Segments = () => (
  <Progress
    value={51}
    max={73}
    segments={[10, 10, 10, 10, 10, 1, 0, 0].map((value, index) => ({ value, max: [10, 10, 10, 10, 10, 10, 7, 6][index] }))}
  />
)
export const ManySegments = () => <Progress value={273} max={416} segments={Array(32).fill(13).map((max, index) => ({ value: index % 3 ? max : 0, max }))} />
