import { useState } from 'react'
import { useResponsiveValue } from '@sensorr/utils'
import Tippy from '@tippyjs/react'
import { Badge } from '../../../atoms/Badge/Badge'
import { Credits } from '../Credits/Credits'

export const CreditsBadge = ({ entity, display = 'poster', credits, loadCredits, parent, palette, ...props }) => {
  const [target, setTarget] = useState(null)
  const maxWidth = useResponsiveValue(['100vw', '80vw'])

  return (
    <Tippy
      maxWidth={maxWidth}
      onShow={loadCredits}
      placement='bottom-start'
      theme='transparent'
      trigger='click'
      triggerTarget={target}
      reference={parent}
      interactive={true}
      hideOnClick={true}
      appendTo={parent.current}
      popperOptions={{ modifiers: [{ name: 'flip', enabled: false }, { name: 'preventOverflow', enabled: false }] }}
      zIndex={3}
      content={(
        <div sx={{ fontSize: [10, 9], margin: { poster: ['-3.25rem 0 0 -1rem', '-4.25rem 0 0 -0.75rem'], pretty: '-2.5rem 0 0 -1.5rem' }[display] }}>
          <Credits credits={credits || []} length={{ poster: 5, pretty: 6 }[display]} />
        </div>
      )}
    >
      <span
        ref={el => setTarget(el)}
        onMouseEnter={() => loadCredits()}
        sx={{ cursor: 'pointer' }}
        title={credits === null ? 'Loading credits' : `Following ${(credits || []).filter(c => c.state === 'followed')?.length} credited stars`}
      >
        <Badge
          emoji='⭐️'
          compact={true}
          size='small'
          palette={palette}
          label={credits === null ? '-' : (credits || []).filter(c => c.state === 'followed')?.length}
        />
      </span>
    </Tippy>
  )
}
