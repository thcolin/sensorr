import { Link } from '../../../atoms/Link/Link'
import { memo } from 'react'
import { Lines, Skeleton, reveal } from '../../../atoms/Skeleton/Skeleton'
import { Poster, PosterProps } from '../Poster/Poster'

export type CardProps = PosterProps

const UICard = ({
  details,
  link,
  ready,
  badges,
  ...props
}: CardProps) => (
  <div sx={UICard.styles.element}>
    <div sx={UICard.styles.poster}>
      <Poster {...props} details={details} link={link} ready={ready} meaningful={false} />
    </div>
    <div sx={UICard.styles.about}>
      <About details={details} link={link} ready={ready} />
    </div>
    <div sx={UICard.styles.actions}>
      {ready !== false && badges?.state?.component && <div sx={reveal}><badges.state.component {...badges?.state?.props} /></div>}
    </div>
  </div>
)

UICard.styles = {
  element: {
    position: 'relative',
    alignItems: 'center',
    display: 'flex',
    flexShrink: 0,
    height: '7.5em',
    width: '100%',
    maxWidth: '35em',
    contain: 'strict',
  },
  link: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    height: '100%',
    overflow: 'hidden',
  },
  poster: {
    flexShrink: 0,
    fontSize: 8,
  },
  about: {
    display: 'flex',
    flex: 1,
    height: '100%',
    paddingX: 4,
    overflow: 'hidden',
  },
  actions: {
    alignSelf: 'flex-start',
    paddingLeft: 4,
    fontSize: 6,
    flexShrink: 0,
  },
}

export const Card = memo(UICard)

const UIAbout = ({ details, link, ready, ...props }) => (
  <span sx={UIAbout.styles.element}>
    <strong sx={UIAbout.styles.title} title={details.title}>
      <Skeleton ready={ready !== false} bar={{ width: '10em', height: '0.75em' }}>
        <Link to={link?.to} state={link?.state} sx={UICard.styles.link}>
          {details.title}
        </Link>
      </Skeleton>
    </strong>
    <Skeleton ready={ready !== false} bar={{ width: '7em', height: '0.5em' }} sx={UIAbout.styles.subtitle}>
      <span sx={UIAbout.styles.caption}>
        {!!details?.meaningful?.year && (
          <span>
            <details.meaningful.year />
            {(!!details?.meaningful?.genres || !!details?.caption) && <span sx={{ marginX: 8 }}>&nbsp;·&nbsp;</span>}
          </span>
        )}
        {(!!details?.meaningful?.genres || !!details?.caption) && (
          <small title={details?.caption}>
            {details?.meaningful?.genres ? <details.meaningful.genres emoji={false} /> : details?.caption}
          </small>
        )}
      </span>
    </Skeleton>
    <Skeleton ready={ready !== false} placeholder={<Lines widths={['100%', '72%']} height='0.5em' />} align='start' sx={UIAbout.styles.overview}>
      <small>{details.overview}</small>
    </Skeleton>
  </span>
)

UIAbout.styles = {
  element: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  title: {
    margin: 12,
    fontSize: 4,
    fontWeight: 'strong',
    lineHeight: 'body',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    '>a': {
      display: 'inline',
    },
  },
  subtitle: {
    paddingBottom: 8,
    paddingTop: 10,
  },
  caption: {
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    '>span': {
      fontSize: 6,
      fontWeight: 'semibold',
    },
    '>small': {
      fontSize: 6,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      opacity: 0.75,
    },
  },
  overview: {
    flex: 1,
    fontSize: 6,
    fontFamily: 'heading',
    lineHeight: 'heading',
    fontWeight: 'medium',
    whiteSpace: 'pre-wrap',
    overflowY: 'auto',
    overflowX: 'hidden',
  },
}

const About = memo(UIAbout)
