import { Shadow as UIShadow } from './Shadow'
import { fixtures as palettes } from '@sensorr/palette'

export default { component: UIShadow, title: 'Atoms / Shadow' }

export const Shadow = (args: any) => <UIShadow {...args} />

Shadow.args = {
  palette: palettes.green,
}

Shadow.argTypes = {
  palette: {
    control: {
      type: 'select',
      options: {
        none: null,
        Green: palettes.green,
        Blue: palettes.blue,
      },
    },
  },
}
