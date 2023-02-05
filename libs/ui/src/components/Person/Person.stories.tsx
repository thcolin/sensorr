import { Meta } from '@storybook/react'
import { Person as UIPerson } from './Person'
import { fixtures } from '@sensorr/tmdb'

export default { component: UIPerson, title: 'Components / Person' } as Meta

export const Person = (args: any) => <UIPerson {...args} />

Person.args = {
  display: 'poster',
  entity: fixtures.person,
  state: 'followed',
  placeholder: null,
}

Person.argTypes = {
  entity: {
    control: {
      type: null,
    },
  },
}

export const PersonPosterLoading = (args: any) => <Person {...args} />

PersonPosterLoading.args = {
  placeholder: true,
}

export const PersonPoster = (args: any) => <Person {...args} />

PersonPoster.args = {
  display: 'poster',
  entity: fixtures.person,
  state: 'followed',
  placeholder: null,
}

export const PersonPosterWithFocus = (args: any) => <Person {...args} focus='popularity' />

PersonPosterWithFocus.args = {
  display: 'poster',
  entity: fixtures.person,
  state: 'followed',
  placeholder: null,
}

export const PersonPrettyLoading = (args: any) => <Person {...args} />

PersonPrettyLoading.args = {
  display: 'pretty',
  placeholder: true,
}

export const PersonPretty = (args: any) => <Person {...args} />

PersonPretty.args = {
  display: 'pretty',
  entity: fixtures.person,
  focus: null,
  state: 'followed',
  placeholder: null,
}
