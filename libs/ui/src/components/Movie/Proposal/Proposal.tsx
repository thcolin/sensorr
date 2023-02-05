import { Fragment, memo } from 'react'
import Tippy from '@tippyjs/react'
import { emojize, filesize } from '@sensorr/utils'
import { Icon } from '../../../atoms/Icon/Icon'
import { Badge } from '../../../atoms/Badge/Badge'

const UIProposal = ({ proposals, releases, proceed, ...props }) => (
  <Tippy
    maxWidth='80vw'
    interactive={true}
    trigger='click'
    placement='bottom'
    appendTo={document.body}
    content={(
      <div sx={UIProposal.styles.content}>
        {releases.map(release => <small key={release.id}><code>{emojize('📼', `${release.title} (${filesize.stringify(release.size)})`)}</code></small>)}
        {!!releases.length && <hr/>}
        {proposals.map(proposal => (
          <Fragment key={proposal.id}>
            <small><code>{emojize('🛎', `${proposal.title} (${filesize.stringify(proposal.size)}) - ${proposal.znab}`)}</code></small>
            <div sx={UIProposal.styles.buttons}>
              <button sx={{ variant: 'button.reset' }} onClick={() => proceed(proposal, true)}>
                <Badge
                  emoji={<Icon value='check' width='1em' height='1em' />}
                  label='Accept'
                  compact={false}
                  size='small'
                  color='theme'
                />
              </button>
              <button sx={{ variant: 'button.reset' }} onClick={() => proceed(proposal, false)}>
                <Badge
                  emoji={<Icon value='clear' width='1em' height='1em' />}
                  label='Refuse'
                  compact={false}
                  size='small'
                  color='theme'
                />
              </button>
            </div>
          </Fragment>
        ))}
      </div>
    )}
  >
    <button sx={{ variant: 'button.reset' }}>
      <Badge emoji='🛎' compact={true} size='small' />
    </button>
  </Tippy>
)

UIProposal.styles = {
  content: {
    display: 'flex',
    flexDirection: 'column',
    padding: 10,
    '>hr': {
      width: '100%',
      border: 'none',
      borderBottom: '1px solid',
      borderColor: 'grayDark',
    },
  },
  buttons: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 10,
    '>button': {
      marginX: 8,
    },
  },
}

export const Proposal = memo(UIProposal)
