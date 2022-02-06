import { Meta } from '@storybook/react'
import { ColorModeWrapper } from '../../../.storybook/helpers'
import { Button as UIButton } from './Button'

export default { component: UIButton, title: 'Atoms / Button' } as Meta

export const Button = (args: any) => <UIButton {...args} />

Button.args = {
  variant: 'contain',
  color: 'primary',
  children: 'Apply',
}

export const LightContainButton = (args: any) => (
  <ColorModeWrapper value='light'>
    <Button variant='contain' children='Apply' color='black' />
  </ColorModeWrapper>
)

export const DarkContainButton = (args: any) => (
  <ColorModeWrapper value='dark'>
    <Button variant='contain' children='Apply' color='primary' />
  </ColorModeWrapper>
)

export const PrimaryContainButton = (args: any) => (
  <ColorModeWrapper value='primary'>
    <Button variant='contain' children='Apply' />
  </ColorModeWrapper>
)

export const LightOutlineButton = (args: any) => (
  <ColorModeWrapper value='light'>
    <Button variant='outline' children='Cancel' color='black' />
  </ColorModeWrapper>
)

export const DarkOutlineButton = (args: any) => (
  <ColorModeWrapper value='dark'>
    <Button variant='outline' children='Cancel' color='primary' />
  </ColorModeWrapper>
)

export const PrimaryOutlineButton = (args: any) => (
  <ColorModeWrapper value='primary'>
    <Button variant='outline' children='Cancel' />
  </ColorModeWrapper>
)
