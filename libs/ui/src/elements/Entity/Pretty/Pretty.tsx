import React, { memo, useCallback, useRef, useState } from 'react'
import { useThemeUI } from 'theme-ui'
import { useTranslation } from 'react-i18next'
import { usePalette } from '@sensorr/palette'
import { Poster, PosterProps } from '../Poster/Poster'
import { Billboard } from '../../../atoms/Billboard/Billboard'
import { Link } from '../../../atoms/Link/Link'

export interface PrettyProps extends Omit<PosterProps, 'palette' | 'onReady'> {}

const UIPretty = ({
  details,
  link = null,
  actions = {},
  badges = [],
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
    <div sx={UIPretty.styles.element} ref={ref}>
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
          actions={actions}
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
    marginTop: '2.5em',
    marginBottom: '5.375em',
    marginX: 4,
  },
  billboard: {
    position: 'absolute',
    height: 'calc(100% - 2em)',
    width: '100%',
    overflow: 'hidden',
    marginTop: 0,
  },
  poster: {
    flexShrink: 0,
    marginTop: '-0.25em',
  },
  about: {
    display: 'flex',
    flex: 1,
    marginTop: 0,
    paddingRight: 2,
    paddingY: 2,
    overflow: 'hidden',
  },
  relations: {
    position: 'absolute',
    bottom: '0em',
    left: '0em',
    zIndex: 1,
    transition: 'opacity 400ms ease-in-out',
  },
  guests: {
    position: 'absolute',
    bottom: '0em',
    right: '0em',
    zIndex: 1,
    transition: 'opacity 400ms ease-in-out',
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
        {badges.map(({ component: Component, props }) => <Component {...props} palette={palette} parent={parent} />)}
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
    alignItems: 'flex-start',
    overflowX: 'auto',
    whiteSpace: 'nowrap',
    fontWeight: 'semibold',
    '>*:not(:last-child)': {
      marginRight: 8
    },
  },
  overview: {
    flex: 1,
    marginTop: 8,
    fontFamily: 'heading',
    lineHeight: 'heading',
    fontWeight: 'medium',
    whiteSpace: 'pre-wrap',
    overflowY: 'auto',
  },
}

const About = memo(UIAbout)
