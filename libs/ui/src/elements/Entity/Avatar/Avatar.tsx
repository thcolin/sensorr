import { useMemo, memo } from 'react'
import Tippy from '@tippyjs/react'
import { Tooltip } from '../../../atoms/Tooltip/Tooltip'
import { Picture, PictureProps } from '../../../atoms/Picture/Picture'
import { Link } from '../../../atoms/Link/Link'
import { PersonDetails } from '../../../components/Person/Person'
import { MovieDetails } from '../../../components/Movie/Movie'

interface AvatarProps extends Omit<PictureProps, 'path' | 'ready' | 'onLoad' | 'onError'> {
  details: PersonDetails | MovieDetails
  link?: string
  overrides?: { focus?: React.ReactNode, ready?: boolean, hover?: boolean }
  highlight?: boolean
}

const UIAvatar = ({
  details,
  overrides,
  link,
  highlight,
  ...props
}: AvatarProps) => {
  const tooltip = useMemo(() => <Tooltip title={details?.title} subtitle={details?.caption} />, [details])
  const styles = useMemo(() => ({
    ...UIAvatar.styles,
    element: {
      ...UIAvatar.styles.element,
      ...(!!highlight ? { borderColor: 'primary' } : {}),
    },
  }), [highlight])

  return (
    <Tippy placement='bottom' disabled={overrides?.ready === false} content={tooltip}>
      <div tabIndex={0} sx={styles.element}>
        <Link to={link} disabled={overrides?.ready === false}>
          <Picture {...props} path={details?.poster} ready={overrides?.ready !== false} />
        </Link>
      </div>
    </Tippy>
  )
}

UIAvatar.styles = {
  element: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    height: '10em',
    width: '10em',
    borderRadius: '50%',
    overflow: 'hidden',
    border: 'avatar',
    '>a': {
      flex: 1,
      height: '100%',
      '>span>img': {
        objectPosition: '50% 20%',
      },
    },
  },
}

export const Avatar = memo(UIAvatar)
