import { ColorModeWrapper } from '../../../../helpers'
import { FilterProposal as UIFilterProposal } from './FilterProposal'

export default { component: UIFilterProposal, title: 'Components / Movie / filters / Proposal' }

export const FilterProposal = (args: any) => (
  <ColorModeWrapper value='primary'>
    <UIFilterProposal {...args} />
  </ColorModeWrapper>
)

FilterProposal.args = {
  value: { values: [true] },
  onChange: () => {},
  statistics: [
    { _id: true, count: 3 },
    { _id: false, count: 5 },
  ],
  disabled: false,
}

FilterProposal.argTypes = {
  value: {
    control: null,
  },
  statistics: {
    control: null,
  },
}
