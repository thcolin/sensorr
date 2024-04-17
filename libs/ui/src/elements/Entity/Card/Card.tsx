import { Link } from 'libs/ui/src/atoms/Link/Link'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Poster, PosterProps } from '../Poster/Poster'

export interface CardProps extends PosterProps {}

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
      {badges?.state?.component && <badges.state.component {...badges?.state?.props} />}
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

const UIAbout = ({ details, link, ready, ...props }) => {
  const { t } = useTranslation()

  return (
    <span sx={UIAbout.styles.element}>
      <strong sx={UIAbout.styles.title} title={details.title}>
        <Link to={link?.to} state={link?.state} disabled={ready === false} sx={UICard.styles.link}>
          {details.title}
        </Link>
      </strong>
      <span sx={UIAbout.styles.subtitle}>
        {!!details?.meaningful?.year && (
          <span>
            <details.meaningful.year />
            {(!!details?.meaningful?.genres || !!details?.caption) && <span sx={{ marginX: 8 }}>&nbsp;·&nbsp;</span>}
          </span>
        )}
        {(!!details?.meaningful?.genres || !!details?.caption) && (
          <small title={details?.caption}>
            {!!details?.meaningful?.genres ? <details.meaningful.genres emoji={false} /> : details?.caption}
          </small>
        )}
      </span>
      <span sx={UIAbout.styles.overview}>
        <small>{details.overview || <em>{ready ? '' : t('loading')}</em>}</small>
      </span>
    </span>
  )
}

UIAbout.styles = {
  element: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflowY: 'auto',
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
    display: 'flex',
    alignItems: 'center',
    paddingBottom: 8,
    paddingTop: 10,
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
  },
}

const About = memo(UIAbout)
