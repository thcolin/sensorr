import { Meta } from '@storybook/react'
import { Billboard as UIBillboard } from './Billboard'
import { fixtures as palettes } from '@sensorr/palette'

export default { component: UIBillboard, title: 'Atoms / Billboard' } as Meta

export const Billboard = (args: any) => <UIBillboard {...args} />

Billboard.args = {
  palette: palettes.green,
  path: '/ByDf0zjLSumz1MP1cDEo2JWVtU.jpg',
}

Billboard.argTypes = {
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
