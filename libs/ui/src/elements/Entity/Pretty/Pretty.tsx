import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useThemeUI } from 'theme-ui'
import { useTranslation } from 'react-i18next'
import { usePalette } from '@sensorr/palette'
import { Poster, PosterProps } from '../Poster/Poster'
import { Billboard } from '../../../atoms/Billboard/Billboard'
import { pictureSrc } from '../../../atoms/Picture/Picture'
import { Link } from '../../../atoms/Link/Link'
import { DragScroll } from '../../../atoms/DragScroll/DragScroll'
import { Bar, Lines, Skeleton, barTintOf } from '../../../atoms/Skeleton/Skeleton'
import { Credits } from '../../../components/Movie/Credits/Credits'

export type PrettyProps = Omit<PosterProps, 'palette' | 'onReady'>

const UIPretty = ({
  details,
  link = null,
  badges = {},
  credits,
  ...props
}: PrettyProps) => {
  const ref = useRef()
  const { theme } = useThemeUI()

  // The path each picture loaded: a placeholder reports its empty one as loaded, which says nothing of the entity's
  const [poster, setPoster] = useState(undefined)
  const [background, setBackground] = useState(undefined)

  const onPosterReady = useCallback(() => setPoster(details?.poster), [details?.poster])
  const onBillboardReady = useCallback(() => setBackground(details?.billboard), [details?.billboard])

  const palette = usePalette(
    !!details?.poster && pictureSrc(details.poster, 'w92'),
    (props as any).palette || {
      backgroundColor: theme.rawColors.grayLight,
      color: theme.rawColors.text,
      alternativeColor: theme.rawColors.text,
      negativeColor: theme.rawColors.text,
    },
    details?.poster,
  )

  // Nothing shows before the poster, the billboard and their colors: the texts never come first
  const colored = !details?.poster || (!palette.loading && !palette.initial)
  const ready = colored && background === details?.billboard && poster === details?.poster && props.ready !== false
  // One sequence: the poster's colors bleed into the blocks and the bars as soon as they are known, the bars take the
  // texts' widths once everything is loaded, then the texts, the pictures and the badges show together
  const [titled, setTitled] = useState(false)
  const revealed = ready && titled
  const onTitled = useCallback(() => setTitled(true), [])

  useEffect(() => {
    if (!ready) {
      setTitled(false)
    }
  }, [ready])

  return (
    <div sx={UIPretty.styles.element} ref={ref} onMouseEnter={props.loadExternals}>
      <div sx={UIPretty.styles.billboard}>
        <Billboard
          path={details?.billboard}
          palette={palette.palette}
          ready={revealed}
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
          ready={revealed}
          meaningful={false}
          // Its block in the bars' color, gray then the poster's tint, until its picture shows
          palette={{ ...palette.palette, backgroundColor: barTintOf(palette.palette) }}
          onReady={onPosterReady}
        />
      </div>
      <div sx={UIPretty.styles.about}>
        <About
          details={details}
          link={link}
          badges={badges}
          ready={ready}
          onTitled={onTitled}
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

const UIAbout = ({ details, palette, ready, onTitled, link, badges, parent, ...props }) => {
  const { t } = useTranslation()
  const tint = barTintOf(palette)

  return (
    <div sx={UIAbout.styles.element}>
      <h2 sx={UIAbout.styles.title} title={details.title} style={{ color: palette.color }}>
        <Skeleton ready={ready} tint={tint} bar={{ width: '12em', height: '1em' }} onShown={onTitled}>
          <Link to={link?.to} state={link?.state}>{details.title}</Link>
        </Skeleton>
      </h2>
      <Skeleton ready={ready} tint={tint} bar={{ width: '9em', height: '0.75em' }} sx={UIAbout.styles.subtitle}>
        <span sx={UIAbout.styles.caption} style={{ color: palette.alternativeColor }}>
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
      <DragScroll sx={UIAbout.styles.badges} byBackground={true}>
        {/* The reviews' pill, 80 by 24 pixels */}
        <Skeleton ready={ready} tint={tint} clip={false} placeholder={<Bar width='5em' height='1.5em' pill={true} />}>
          <span sx={UIAbout.styles.pills}>
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
          </span>
        </Skeleton>
      </DragScroll>
      {/* 12px text on the 18px lines its 16px block sets */}
      <Skeleton ready={ready} tint={tint} placeholder={<Lines height='0.75em' lineHeight={1.5} />} align='start' sx={UIAbout.styles.overview} style={{ color: palette.negativeColor }}>
        <small>{details.overview || <em>{t('noOverview')}</em>}</small>
      </Skeleton>
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
  },
  pills: {
    display: 'flex',
    alignItems: 'center',
    '>*:not(:last-child)': {
      marginRight: 8
    },
  },
  guests: {
    fontSize: 9,
    marginLeft: 6,
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
