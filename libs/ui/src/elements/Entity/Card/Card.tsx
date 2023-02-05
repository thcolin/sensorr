import { Link } from 'libs/ui/src/atoms/Link/Link'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Poster, PosterProps } from '../Poster/Poster'

export interface CardProps extends Omit<PosterProps, 'focus' | 'actions' | 'relations' | 'overrides' | 'onReady' | 'palette'> {
  overrides?: { ready?: boolean }
}

const UICard = ({
  details,
  link,
  state: [State, state] = [],
  ...props
}: CardProps) => {
  const overrides = useMemo(() => ({ ...(props.overrides || {}), hover: false }), [props.overrides])

  return (
    <CardWrapper>
      <Link to={link?.to} state={link?.state} disabled={overrides.ready === false} sx={UICard.styles.link}>
        <span sx={UICard.styles.poster}>
          <Poster
            {...props}
            overrides={overrides}
            details={details}
          />
        </span>
        <span sx={UICard.styles.about}>
          <About
            title={details?.title}
            overview={details?.overview}
            meaningful={details?.meaningful}
            ready={overrides.ready}
          />
        </span>
      </Link>
      <div sx={UICard.styles.state}>
        {State && <State {...state} />}
      </div>
    </CardWrapper>
  )
}

UICard.styles = {
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
  state: {
    alignSelf: 'flex-start',
    paddingLeft: 4,
    fontSize: 6,
    flexShrink: 0,
  },
}

export const Card = memo(UICard)

const UICardWrapper = ({ ...props }) => (
  <div {...props} sx={UICardWrapper.styles.element} />
)

UICardWrapper.styles = {
  element: {
    position: 'relative',
    alignItems: 'center',
    display: 'flex',
    flexShrink: 0,
    height: '7.5em',
    // minWidth: '20em',
    width: '100%',
    maxWidth: '35em',
    contain: 'strict',
  },
}

const CardWrapper = memo(UICardWrapper)

const UIAbout = ({ title, meaningful, overview, ready, ...props }) => {
  const { t } = useTranslation()

  return (
    <span sx={UIAbout.styles.element}>
      <strong sx={UIAbout.styles.title} title={title}>
        {title}
      </strong>
      <span sx={UIAbout.styles.meaningful}>
        <span>{
          (meaningful?.release_date && <meaningful.release_date />) ||
          (meaningful?.job && <meaningful.job />) ||
          (meaningful?.character && <meaningful.character />) ||
          (meaningful?.known_for_department && <meaningful.known_for_department />)
        }</span>
        <strong>{(meaningful?.vote_average && <meaningful.vote_average />)}</strong>
      </span>
      <span sx={UIAbout.styles.meaningful}>
        <b>{(meaningful?.genres && <meaningful.genres />)}</b>
      </span>
      <span sx={UIAbout.styles.overview}>
        <small>{overview || <em>{t(ready ? 'noOverview' : 'loading')}</em>}</small>
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
    marginBottom: 10,
    fontSize: 4,
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
    fontSize: 6,
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
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
    fontSize: 6,
    fontFamily: 'heading',
    lineHeight: 'heading',
    fontWeight: 'medium',
    whiteSpace: 'pre-wrap',
    overflowY: 'auto',
  },
}

const About = memo(UIAbout)
