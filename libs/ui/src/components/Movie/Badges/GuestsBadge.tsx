import { useState } from 'react'
import { useResponsiveValue } from '@sensorr/utils'
import Tippy from '@tippyjs/react'
import { Badge } from '../../../atoms/Badge/Badge'
import { Guests } from '../Guests/Guests'

export const GuestsBadge = ({ entity, display = 'poster', guests, parent, palette, visible, ...props }) => {
  const [target, setTarget] = useState(null)
  const maxWidth = useResponsiveValue(['100vw', '80vw'])

  return (
    <Tippy
      maxWidth={maxWidth}
      placement='bottom-start'
      theme='transparent'
      trigger='click'
      triggerTarget={target}
      reference={parent}
      interactive={true}
      {...(visible ? { visible } : { hideOnClick: true })}
      appendTo={parent.current}
      popperOptions={{ modifiers: [{ name: 'flip', enabled: false }, { name: 'preventOverflow', enabled: false }] }}
      zIndex={3}
      content={(
        <div sx={{ fontSize: '1rem' }}>
          <div sx={{ fontSize: [9, 8], margin: { poster: ['-3.25rem 0 0 -1rem', '-4.25rem 0 0 -0.5rem'], pretty: '-2.5rem 0 0 -1.5rem' }[display] }}>
            <Guests guests={guests || []} />
          </div>
        </div>
      )}
    >
      <span
        ref={el => setTarget(el)}
        sx={{ cursor: 'pointer' }}
        title={`Requested from ${guests.length} friends`}
      >
        <Badge
          emoji='🍺'
          compact={true}
          size='small'
          palette={palette}
          label={guests?.length}
        />
      </span>
    </Tippy>
  )
}
