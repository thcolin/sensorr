import { useState } from 'react'
import { emojize } from '@sensorr/utils'
import { Button } from '../../atoms/Button/Button'
import { Bulk as UIBulk } from './Bulk'

export default { component: UIBulk, title: 'Elements / Bulk' }

// The bar is fixed to the bottom of the screen, so each story toggles its own selection to be seen alone.
const Story = ({ count: initial, ...args }: any) => {
  const [count, setCount] = useState(initial)

  return (
    <div>
      <Button variant='outline' color='gray' onClick={() => setCount(count ? 0 : args.total)}>
        {count ? 'Clear' : `Select ${args.total}`}
      </Button>
      <UIBulk {...args} count={count} onClear={() => setCount(0)} />
    </div>
  )
}

export const Swaps = (args: any) => <Story {...args} />

Swaps.args = {
  count: 12,
  total: 12,
  actions: [
    { key: 'refuse', label: 'Refuse', variant: 'outline', color: 'primary', onClick: () => null },
    { key: 'accept', label: 'Accept', variant: 'contain', color: 'primary', onClick: () => null },
  ],
}

export const Library = (args: any) => <Story {...args} />

Library.args = {
  count: 0,
  total: 8912,
  actions: [
    {
      key: 'state',
      label: emojize('📚', 'State'),
      options: [
        { value: 'ignored', label: emojize('🔕', 'Ignored') },
        { value: 'wished', label: emojize('🍿', 'Wished') },
        { value: 'pinned', label: emojize('📍', 'Pinned') },
        { value: 'archived', label: emojize('📼', 'Archived') },
      ],
      onChange: () => null,
    },
    { key: 'proposal', label: emojize('🛎️', 'Proposal'), options: [{ value: true, label: 'Accept' }, { value: false, label: 'Refuse' }], onChange: () => null },
    { key: 'policy', label: emojize('🚨', 'Policy'), options: [{ value: 'MULTi-VF2', label: '🇺🇳  MULTi-VF2' }, { value: 'VOF', label: '🇫🇷  VOF' }, { value: 'SD+', label: '📺  SD+' }], onChange: () => null },
    { key: 'refine', label: emojize('✨', 'Refine'), options: [{ value: true, label: 'Enable' }, { value: false, label: 'Disable' }], onChange: () => null },
    { key: 'shrink', label: emojize('✂️', 'Shrink'), options: [{ value: true, label: 'Enable' }, { value: false, label: 'Disable' }], onChange: () => null },
  ],
}
