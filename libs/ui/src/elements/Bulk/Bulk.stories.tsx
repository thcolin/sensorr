import { useState } from 'react'
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
      <UIBulk {...args} count={count} />
    </div>
  )
}

export const Swaps = (args: any) => <Story {...args} />

Swaps.args = {
  count: 12,
  total: 12,
  actions: [
    { key: 'accept', label: 'Accept', variant: 'contain', color: 'primary', onClick: () => null },
    { key: 'refuse', label: 'Refuse', variant: 'outline', color: 'primary', onClick: () => null },
  ],
}

export const Library = (args: any) => <Story {...args} />

Library.args = {
  count: 0,
  total: 8912,
  actions: [
    {
      key: 'state',
      icon: '📚', label: 'State',
      options: [
        { value: 'ignored', icon: '🔕', label: 'Ignored' },
        { value: 'wished', icon: '🍿', label: 'Wished' },
        { value: 'pinned', icon: '📍', label: 'Pinned' },
        { value: 'archived', icon: '📼', label: 'Archived' },
      ],
      onChange: () => null,
    },
    { key: 'proposal', icon: '🛎️', label: 'Proposal', options: [{ value: true, label: 'Accept' }, { value: false, label: 'Refuse' }], onChange: () => null },
    { key: 'policy', icon: '🚨', label: 'Policy', options: [{ value: 'MULTi-VF2', label: '🇺🇳  MULTi-VF2' }, { value: 'VOF', label: '🇫🇷  VOF' }, { value: 'SD+', label: '📺  SD+' }], onChange: () => null },
    { key: 'refine', icon: '✨', label: 'Refine', options: [{ value: true, label: 'Enable' }, { value: false, label: 'Disable' }], onChange: () => null },
    { key: 'shrink', icon: '✂️', label: 'Shrink', options: [{ value: true, label: 'Enable' }, { value: false, label: 'Disable' }], onChange: () => null },
  ],
}
