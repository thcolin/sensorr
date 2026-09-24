import { ShowState as UIState, EpisodeStatus as UIEpisodeStatus } from './State'

export default { component: UIState, title: 'Components / Show / State' }

export const State = (args: any) => <UIState {...args} />

State.args = {
  value: 'followed',
  onChange: () => {},
  size: 'normal',
  compact: false,
}

State.argTypes = {
  value: {
    control: {
      type: 'select',
      options: {
        loading: 'loading',
        unfollowed: 'unfollowed',
        followed: 'followed',
      },
    },
  },
  onChange: {
    control: {
      type: null,
    },
  },
}

export const Loading = (args: any) => <State {...args} value='loading' />
export const Unfollowed = (args: any) => <State {...args} value='unfollowed' />
export const Followed = (args: any) => <State {...args} value='followed' />

export const EpisodeUpcoming = () => <UIEpisodeStatus value='upcoming' size='small' />
export const EpisodeUnmonitored = () => <UIEpisodeStatus value='unmonitored' size='small' />
export const EpisodeWanted = () => <UIEpisodeStatus value='wanted' size='small' />
export const EpisodeProposed = () => <UIEpisodeStatus value='proposed' size='small' />
export const EpisodeOwned = () => <UIEpisodeStatus value='owned' size='small' />
export const EpisodeOwnedCompact = () => <UIEpisodeStatus value='owned' size='small' compact={true} />
