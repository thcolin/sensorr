import { Show as UIShow } from './Show'
import { fixtures } from '@sensorr/tmdb'

export default { component: UIShow, title: 'Components / Show' }

const entity = { ...fixtures.show, progress: { owned: 51, aired: 73 } }

const proposal = {
  id: 'proposal',
  title: 'Game.of.Thrones.S08.MULTi.1080p.BluRay.x264-GRP',
  size: 41e9,
  znab: 'C411',
  proposal: true,
  coverage: [1, 2, 3, 4, 5, 6].map(episode => ({ season: 8, episode })),
  level: 'season',
}

export const Show = (args: any) => <UIShow {...args} />

Show.args = {
  entity,
  state: 'followed',
  placeholder: null,
}

Show.argTypes = {
  entity: {
    control: {
      type: null,
    },
  },
}

export const ShowPosterLoading = () => <UIShow entity={null} placeholder={true} />

export const ShowPosterWithFocus = () => <UIShow entity={entity} state='unfollowed' focus='vote_average' />

export const ShowPosterUnfollowed = () => <UIShow entity={entity} state='unfollowed' />

export const ShowPosterComplete = () => <UIShow entity={{ ...entity, progress: { owned: 73, aired: 73 } }} state='followed' />

export const ShowPosterNearlyComplete = () => <UIShow entity={{ ...entity, progress: { owned: 136, aired: 138 } }} state='followed' />

export const ShowPosterSelectable = () => <UIShow entity={entity} state='followed' selected={false} onSelectedChange={() => {}} />

export const ShowPosterSelected = () => <UIShow entity={entity} state='followed' selected={true} selectedVisible={true} onSelectedChange={() => {}} />

export const ShowPosterNotAired = () => <UIShow entity={{ ...entity, progress: { owned: 0, aired: 0 } }} state='followed' />

export const ShowPosterWithProposal = () => <UIShow entity={entity} state='followed' metadata={{ releases: [proposal] }} proceedRelease={() => {}} />

export const ShowCard = () => <UIShow entity={entity} display='card' state='followed' />

export const ShowCardUnfollowed = () => <UIShow entity={entity} display='card' state='unfollowed' />

export const ShowCardLoading = () => <UIShow entity={null} display='card' placeholder={true} />
