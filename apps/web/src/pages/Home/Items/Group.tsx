import { cloneElement, ReactElement } from 'react'
import { useHistoryState } from '@sensorr/utils'
import { TAB } from '../../../components/Entities/Tabs'

// The rows of a group as one row: its tabs are their titles, and the row shown is the one picked
export const RowGroup = ({ id, tabs }: { id: string, tabs: { id: string, label: string, element: ReactElement }[] }) => {
  const [current, setCurrent] = useHistoryState(`${id}-tab`, null)
  const selected = tabs.find((tab) => tab.id === current) || tabs[0]

  return cloneElement(selected.element, {
    key: id,
    label: (
      <>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type='button'
            aria-pressed={tab === selected}
            onClick={() => setCurrent(tab.id)}
            sx={{ ...TAB, ...(tab !== selected && { opacity: 0.5 }) }}
          >
            {tab.label}
          </button>
        ))}
      </>
    ),
  })
}
