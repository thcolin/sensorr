import { memo, useCallback, useMemo, useRef, useState } from 'react'
import { useThemeUI } from 'theme-ui'
import { useTranslation } from 'react-i18next'
import { usePalette } from '@sensorr/palette'
import { Poster, PosterProps } from '../Poster/Poster'
import { Billboard } from '../../../atoms/Billboard/Billboard'
import { Link } from '../../../atoms/Link/Link'
import { Credits } from '../../../components/Movie/Credits/Credits'

export interface PrettyProps extends Omit<PosterProps, 'palette' | 'onReady'> {}

const UIPretty = ({
  details,
  link = null,
  badges = {},
  credits,
  ...props
}: PrettyProps) => {
  const ref = useRef()
  const { theme } = useThemeUI()

  const [poster, setPoster] = useState(details?.poster === null)
  const [background, setBackground] = useState(details?.billboard === null)

  const onPosterReady = useCallback(() => setPoster(true), [])
  const onBillboardReady = useCallback(() => setBackground(true), [])

  const palette = usePalette(
    !!details?.poster && `https://image.tmdb.org/t/p/w92${details?.poster}`,
    (props as any).palette || {
      backgroundColor: theme.rawColors.grayLight,
      color: theme.rawColors.text,
      alternativeColor: theme.rawColors.text,
      negativeColor: theme.rawColors.text,
    },
    details?.poster,
  )

  const ready = !palette.loading && background && poster && props.ready !== false

  return (
    <div sx={UIPretty.styles.element} ref={ref} onMouseEnter={props.loadExternals}>
      <div sx={UIPretty.styles.billboard}>
        <Billboard
          path={details?.billboard}
          palette={palette.palette}
          ready={ready}
          size='w780'
          fade={0.125}
          onReady={onBillboardReady}
        />
      </div>
      <div sx={UIPretty.styles.poster}>
        <Poster
          {...props}
          details={details}
          link={link}
          badges={{
            ...(badges?.state ? { state: badges?.state } : {}),
            ...(badges?.proposal ? { proposal: badges?.proposal } : {}),
          }}
          ready={ready}
          meaningful={false}
          palette={palette.palette}
          onReady={onPosterReady}
        />
      </div>
      <div sx={UIPretty.styles.about}>
        <About
          details={details}
          link={link}
          badges={badges}
          ready={ready}
          palette={palette.palette}
          parent={ref}
        />
      </div>
      {!!credits && (
        <div sx={UIPretty.styles.credits}>
          <Credits credits={credits} />
        </div>
      )}
    </div>
  )
}

UIPretty.styles = {
  element: {
    position: 'relative',
    display: 'flex',
    flexShrink: 0,
    height: '16.5em',
    width: '35em',
    maxWidth: '100vw',
    minWidth: '25em',
    marginBottom: '2.5em',
    marginX: 4,
    ':hover >div:nth-child(4)': {
      opacity: 1,
    },
  },
  billboard: {
    position: 'absolute',
    height: 'calc(100% - 2em)',
    width: '100%',
    overflow: 'hidden',
    marginTop: '3em',
  },
  poster: {
    flexShrink: 0,
  },
  about: {
    display: 'flex',
    flex: 1,
    marginTop: '3em',
    paddingRight: 2,
    paddingTop: 6,
    paddingBottom: 8,
    overflow: 'hidden',
  },
  credits: {
    position: 'absolute',
    fontSize: 9,
    bottom: '-2.5rem',
    left: '-2rem',
    opacity: 0,
    transition: 'opacity 400ms ease-in-out',
    zIndex: 6,
  },
}

export const Pretty = memo(UIPretty)

const UIAbout = ({ details, palette, ready, link, badges, parent, ...props }) => {
  const { t } = useTranslation()

  return (
    <div
      sx={{
        ...UIAbout.styles.element,
        opacity: ready ? 1 : 0,
        transition: 'opacity 400ms ease-in-out',
        transitionDelay: ready ? '800ms' : '0ms',
      }}
    >
      <h2 sx={UIAbout.styles.title} title={details.title} style={{ color: palette.color }}>
        <Link to={link?.to} state={link?.state}>{details.title}</Link>
      </h2>
      <div sx={UIAbout.styles.subtitle} style={{ color: palette.alternativeColor }}>
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
      </div>
      <div sx={UIAbout.styles.badges}>
        {badges?.reviews?.component && (
          <div sx={{ ':hover + div': { opacity: 0, transition: 'none' } }}>
            <badges.reviews.component {...badges?.reviews?.props} palette={palette} />
          </div>
        )}
        {badges?.guests?.component && (
          <div sx={UIAbout.styles.guests}>
            <badges.guests.component {...badges?.guests?.props} />
          </div>
        )}
      </div>
      <div sx={UIAbout.styles.overview} style={{ color: palette.negativeColor }}>
        <small>{details.overview || <em>{t('noOverview')}</em>}</small>
      </div>
    </div>
  )
}

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
    fontSize: 2,
    fontWeight: 'strong',
    lineHeight: 'body',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
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
      fontWeight: 'strong',
    },
    '>small': {
      fontSize: 6,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      fontWeight: 'semibold',
      opacity: 0.75,
    },
  },
  badges: {
    display: 'flex',
    alignItems: 'center',
    minHeight: '2.25em',
    overflowX: 'auto',
    overflowY: 'hidden',
    whiteSpace: 'nowrap',
    fontWeight: 'semibold',
    '>*:not(:last-child)': {
      marginRight: 8
    },
  },
  guests: {
    fontSize: 9,
    marginLeft: 6,
    transition: 'opacity ease-in-out 200ms 200ms',
  },
  overview: {
    flex: 1,
    marginTop: 8,
    fontFamily: 'heading',
    lineHeight: 'heading',
    fontWeight: 'medium',
    whiteSpace: 'pre-wrap',
    overflowY: 'auto',
    overflowX: 'hidden',
  },
}

const About = memo(UIAbout)
