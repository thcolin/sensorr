import { memo } from 'react'
import { Controller } from 'react-hook-form'

export interface InputsProps {
  layout: {
    [key: string]: any
    display: 'grid'
    gridTemplateAreas: any
    gridTemplateColumns?: any
    gridTemplateRows?: any
    gap?: any
  }
  fields: {
    [key: string]: {
      component: React.FC<any>
      initial: any
      serialize: (key: string, value: any) => { [key: string]: string | number }
      props?: {
        [key: string]: any
      }
    }
  }
  statistics?: {
    [key: string]: any
  }
  control: any
}

const UIInputs = ({ layout, fields, statistics, control, ...props }: InputsProps) => (
  <div sx={{ ...UIInputs.styles.element, ...layout }}>
    {Object.keys(fields).map((name) => {
      const Component = fields[name].component

      return (
        <Controller
          key={name}
          name={name}
          control={control}
          render={({ field: { ref, ...field } }) => (
            <Component
              {...(fields[name].props || {})}
              {...field}
              statistics={statistics[name]}
              style={{ gridArea: name }}
            />
          )}
        />
      )
    })}
  </div>
)

UIInputs.styles = {
  element: {
    '>*': {
      whiteSpace: 'nowrap',
      // overflow: 'hidden',
    },
  }
}

export const Inputs = memo(UIInputs)
