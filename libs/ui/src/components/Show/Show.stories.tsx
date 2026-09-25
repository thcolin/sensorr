import { Show as UIShow } from './Show'
import { fixtures } from '@sensorr/tmdb'

export default { component: UIShow, title: 'Components / Show' }

const seasons = (owned: number[], aired: number[]) => ({
  owned: owned.reduce((sum, count) => sum + count, 0),
  aired: aired.reduce((sum, count) => sum + count, 0),
  seasons: aired.map((count, index) => ({ season_number: index + 1, owned: owned[index] || 0, aired: count })),
})

const entity = { ...fixtures.show, progress: seasons([10, 10, 10, 10, 10, 1], [10, 10, 10, 10, 10, 10, 7, 6]) }

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

export const ShowPosterWithFocus = () => <UIShow entity={entity} state='ignored' focus='vote_average' />

export const ShowPosterUnfollowed = () => <UIShow entity={entity} state='unfollowed' />

export const ShowPosterComplete = () => <UIShow entity={{ ...entity, progress: seasons([10, 10, 10, 10, 10, 10, 7, 6], [10, 10, 10, 10, 10, 10, 7, 6]) }} state='followed' />

export const ShowPosterNearlyComplete = () => <UIShow entity={{ ...entity, progress: { owned: 136, aired: 138 } }} state='followed' />

export const ShowPosterOneSeason = () => <UIShow entity={{ ...entity, progress: seasons([4], [10]) }} state='followed' />

export const ShowPosterManySeasons = () => (
  <UIShow
    entity={{ ...entity, progress: seasons([0, 10, 11, 13, 13, 13, 13, 0, 13, 13, 13, 0, 13, 0, 0, 0, 0, 0, 13], Array(32).fill(13)) }}
    state='followed'
  />
)

export const ShowPrettyLoading = () => <UIShow entity={null} display='pretty' placeholder={true} />

export const ShowPretty = () => <UIShow entity={entity} display='pretty' state='followed' />

export const ShowPosterSelectable = () => <UIShow entity={entity} state='followed' selected={false} onSelectedChange={() => {}} />

export const ShowPosterSelected = () => <UIShow entity={entity} state='followed' selected={true} selectedVisible={true} onSelectedChange={() => {}} />

export const ShowPosterNotAired = () => <UIShow entity={{ ...entity, first_air_date: '2026-11-25', progress: { owned: 0, aired: 0, seasons: [] } }} state='followed' />

export const ShowPosterNotAiredUndated = () => <UIShow entity={{ ...entity, first_air_date: null, progress: { owned: 0, aired: 0, seasons: [] } }} state='followed' />

export const ShowPosterWithProposal = () => <UIShow entity={entity} state='followed' metadata={{ releases: [proposal] }} proceedRelease={() => {}} />

export const ShowCard = () => <UIShow entity={entity} display='card' state='followed' />

export const ShowCardUnfollowed = () => <UIShow entity={entity} display='card' state='unfollowed' />

export const ShowCardLoading = () => <UIShow entity={null} display='card' placeholder={true} />
