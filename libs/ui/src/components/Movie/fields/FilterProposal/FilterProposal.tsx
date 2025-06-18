import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Checkbox } from '../../../../inputs/Checkbox/Checkbox'
import { emojize } from '@sensorr/utils'

export interface FilterProposalProps {
  statistics: { _id: any, count: number }[]
  value: any
  onChange: any
}

const UIFilterProposal = ({ statistics, ...props }: FilterProposalProps) => {
  const { t } = useTranslation()

  return (
    <Checkbox
      {...props as any}
      label={t('ui.filters.proposal')}
      options={[
        {
          value: true,
          label: emojize('📬', 'With'),
          // count: statistics?.find(obj => obj._id === genre.id)?.count || 0,
        },
        {
          value: false,
          label: emojize('📭', 'Without'),
          // count: statistics?.find(obj => obj._id === genre.id)?.count || 0,
        },
      ]}
      value={props.value.values}
      onChange={values => props.onChange({ ...props.value, values })}
    />
  )
}

export const FilterProposal = memo(UIFilterProposal)
