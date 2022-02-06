import { memo, useMemo, useState, useEffect } from 'react'
import { useThemeUI } from 'theme-ui'
import { useTranslation } from 'react-i18next'
import { useHover } from '@sensorr/utils'
import { usePalette } from '@sensorr/palette'
import { Poster, PosterProps } from '../Poster/Poster'
import { Billboard } from '../../../atoms/Billboard/Billboard'
import { Link } from '../../../atoms/Link/Link'

export interface PrettyProps extends Omit<PosterProps, 'palette' | 'onReady'> {}

const UIPretty = ({
  link,
  details,
  onHover,
  relations: [Relations, relations] = [],
  ...props
}: PrettyProps) => {
  const { theme } = useThemeUI()
  const [isHover, hoverProps] = useHover({ mouseEnterDelayMS: 0, mouseLeaveDelayMS: 0 }, { ...onHover, reverse: true })

  const [poster, setPoster] = useState(details?.poster === null)
  const [background, setBackground] = useState(details?.billboard === null)

  const posterProps = useMemo(() => ({ onReady: () => setPoster(true), onError: () => setPoster(true) }), [])
  const billboardProps = useMemo(() => ({ onReady: () => setBackground(true), onError: () => setBackground(true) }), [])

  const palette = usePalette(
    !!details?.poster && `https://image.tmdb.org/t/p/w92${details?.poster}`,
    (props as any).palette || {
      backgroundColor: theme.rawColors.gray2,
      color: theme.rawColors.text,
      alternativeColor: theme.rawColors.text,
      negativeColor: theme.rawColors.text,
    },
    details?.poster,
  )

  const ready = useMemo(() => !palette.loading && background && poster && props.overrides?.ready !== false, [palette.loading, background, poster, props.overrides])
  const overrides = useMemo(() => ({ ...(props.overrides || {}), ready, hover: false }), [ready, props.overrides])

  return (
    <PrettyWrapper {...onHover}>
      <div sx={UIPretty.styles.billboard}>
        <Billboard
          {...billboardProps}
          path={details?.billboard}
          palette={palette.palette}
          ready={ready}
          size='w780'
          fade={0.125}
        />
      </div>
      <div sx={UIPretty.styles.poster}>
        <Poster
          {...props}
          {...posterProps}
          details={details}
          link={link}
          palette={palette.palette}
          overrides={overrides}
          onHover={hoverProps}
        />
      </div>
      <div sx={UIPretty.styles.about}>
        <About
          title={details?.title}
          overview={details?.overview}
          meaningful={details?.meaningful}
          link={link}
          palette={palette.palette}
          ready={ready}
          pad={!!Relations}
        />
      </div>
      {!!Relations && <div sx={UIPretty.styles.relations}>{<Relations {...relations} />}</div>}
    </PrettyWrapper>
  )
}

UIPretty.styles = {
  billboard: {
    position: 'absolute',
    height: 'calc(100% - 2em)',
    width: '100%',
    overflow: 'hidden',
    marginTop: 0,
  },
  poster: {
    flexShrink: 0,
    paddingBottom: 2,
    paddingLeft: 2,
  },
  about: {
    display: 'flex',
    flex: 1,
    marginTop: 0,
    paddingX: 2,
    paddingY: 2,
    overflow: 'hidden',
  },
  relations: {
    position: 'absolute',
    bottom: '0em',
    right: '0em',
    zIndex: 1,
  },
}

export const Pretty = memo(UIPretty)

const UIPrettyWrapper = ({ ...props }) => (
  <div {...props} sx={UIPrettyWrapper.styles.element} />
)

UIPrettyWrapper.styles = {
  element: {
    position: 'relative',
    display: 'flex',
    flexShrink: 0,
    height: '16.5em',
    width: '35em',
    maxWidth: '100vw',
    minWidth: '25em',
  },
}

const PrettyWrapper = memo(UIPrettyWrapper)

const UIAbout = ({ title, meaningful, overview, palette, ready, link, pad, ...props }) => {
  const { t } = useTranslation()
  const styles = useMemo(() => ({
    ...UIAbout.styles,
    element: {
      ...UIAbout.styles.element,
      opacity: ready ? 1 : 0,
      transition: 'opacity 400ms ease-in-out',
      transitionDelay: ready ? '800ms' : '0ms',
    },
    title: {
      ...UIAbout.styles.title,
      color: palette.color
    },
    negative: {
      ...UIAbout.styles.meaningful,
      color: palette.negativeColor,
    },
    alternative: {
      ...UIAbout.styles.meaningful,
      color: palette.alternativeColor,
    },
    overview: {
      ...UIAbout.styles.overview,
      color: palette.negativeColor,
      ...(pad ? { marginBottom: 4 } : {}),
    },
  }), [ready, palette, pad])

  return (
    <div sx={styles.element}>
      <h2 sx={styles.title} title={title}>
        <Link to={link}>{title}</Link>
      </h2>
      <div sx={styles.negative}>
        <span>{
          (meaningful?.release_date && <meaningful.release_date />) ||
          (meaningful?.job && <meaningful.job />) ||
          (meaningful?.character && <meaningful.character />) ||
          (meaningful?.known_for_department && <meaningful.known_for_department />)
        }</span>
        <strong>{
          (meaningful?.vote_average && <meaningful.vote_average />) ||
          (meaningful?.age && <meaningful.age />)
        }</strong>
      </div>
      <div sx={styles.alternative}>
        <b>{
          (meaningful?.genres && <meaningful.genres />) ||
          (meaningful?.place_of_birth && <meaningful.place_of_birth />)
        }</b>
        <b>{(meaningful?.birthday && <meaningful.birthday />)}</b>
      </div>
      <div sx={styles.overview}>
        <small>{overview || <em>{t('noOverview')}</em>}</small>
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
    fontWeight: 'bold',
    lineHeight: 'body',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
  meaningful: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    '>strong': {
      fontSize: 5,
    },
    '>*:not(strong)': {
      lineHeight: 'space',
      fontSize: 6,
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
