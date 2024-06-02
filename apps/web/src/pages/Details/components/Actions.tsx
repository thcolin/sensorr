import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Icon, QuerySelect, Option } from '@sensorr/ui'
import { keyframes } from '@emotion/react'
import Color from 'color'
import { useThemeUI } from 'theme-ui'
import { useSensorr } from '../../../store/sensorr'

const animations = {
  dots: keyframes`
    0% {
      opacity: 0;
    }
    50% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  `,
  shake: keyframes`
    0% {
      transform: rotate(-8deg);
    }
    10% {
      transform: rotate(-8deg);
    }
    20% {
      transform: rotate(-8deg);
    }
    30% {
      transform: rotate(-8deg);
    }
    40% {
      transform: rotate(-8deg);
    }
    50% {
      transform: rotate(-2deg);
    }
    60% {
      transform: rotate(-8deg);
    }
    70% {
      transform: rotate(-14deg);
    }
    80% {
      transform: rotate(-8deg);
    }
    90% {
      transform: rotate(-2deg);
    }
    100% {
      transform: rotate(-8deg);
    }
  `,
}

const UIMovieActions = ({
  entity,
  metadata,
  setMetadata,
  ready,
  toggleSensorr,
  palette = null,
  ...props
}) => {
  const { colorMode } = useThemeUI()
  const [hover, setHover] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    setExpanded(false)
  }, [entity?.id])

  const modePalette = useMemo(() => {
    if (!palette) {
      return null
    }

    if (
      ((Color(palette?.backgroundColor).luminosity() >= 0.1) && colorMode === 'dark') ||
      ((Color(palette?.backgroundColor).luminosity() <= 0.7) && colorMode === 'light')
    ) {
      return palette
    }

    return {
      backgroundColor: palette?.color,
      alternativeColor: Color(palette?.accentColor)[{ dark: 'darken', light: 'lighten' }[colorMode]](0.25).hexa(),
      accentColor: Color(palette?.alternativeColor)[{ dark: 'darken', light: 'lighten' }[colorMode]](
        Math.max(0.5, Color(palette?.alternativeColor).luminosity() - 0.15)
      ).hexa(),
      color: palette?.backgroundColor,
    }
  }, [palette, colorMode])

  return (
    <div sx={UIMovieActions.styles.element}>
      <Ticket
        entity={entity}
        metadata={metadata}
        ready={ready}
        palette={modePalette}
        expanded={expanded}
        setExpanded={setExpanded}
        setHover={setHover}
        toggleSensorr={toggleSensorr}
      />
      <Preferences
        entity={entity}
        metadata={metadata}
        setMetadata={setMetadata}
        expanded={expanded}
        hover={hover}
      />
    </div>
  )
}

UIMovieActions.styles = {
  element: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    width: '100%',
  },
}

export const MovieActions = memo(UIMovieActions)

const UITicket = ({
  entity,
  metadata,
  ready,
  palette,
  expanded,
  setExpanded,
  setHover,
  toggleSensorr,
  ...props
}) => {
  return (
    <div sx={UITicket.styles.element}>
      <div
        sx={UITicket.styles.wrapper}
        style={{ backgroundColor: palette?.backgroundColor || 'hsla(347, 92%, 65%, 1)' }}
      >
        <span
          sx={UITicket.styles.container}
          style={{
            borderColor: palette?.alternativeColor || 'hsla(347, 60%, 30%, 0.3)',
            opacity: ready ? 1 : 0.5,
            transition: 'opacity 400ms ease-in-out',
          }}
        >
          <span
            sx={UITicket.styles.left}
            style={{
              borderColor: palette?.alternativeColor || 'hsla(347, 60%, 30%, 0.3)',
              color: palette?.accentColor || 'hsla(347, 20%, 34%, 0.34)',
            }}
          >
            <span>
              {(ready && entity?.id) ? String(entity?.id).padStart(8, '0') : 'Loading'}
            </span>
          </span>
          <span sx={UITicket.styles.center}>
            <button
              title={`Search releases for this movie from your indexers`}
              disabled={!ready}
              onClick={(e) => toggleSensorr(e)}
              sx={{
                ':hover:not(:disabled)': {
                  backgroundColor: palette?.backgroundColor ? (Color(palette?.backgroundColor).desaturate(0.15)[(Color(palette?.backgroundColor).luminosity() > 0.5 ? 'darken' : 'lighten')](0.05)).hexa() : 'hsla(347, 80%, 63%, 1)',
                },
                ':active:not(:disabled)': {
                  backgroundColor: palette?.backgroundColor ? (Color(palette?.backgroundColor).desaturate(0.25)[(Color(palette?.backgroundColor).luminosity() > 0.5 ? 'darken' : 'lighten')](0.1)).hexa() : 'hsla(347, 70%, 60%, 1)',
                },
              }}
            >
              <span
                sx={UITicket.styles.subtitle}
                style={{ color: palette?.accentColor || 'hsla(347, 20%, 34%, 0.54)' }}
              >
                Search for
              </span>
              <span
                sx={UITicket.styles.rule}
                style={{ color: palette?.alternativeColor || 'hsla(347, 60%, 30%, 0.3)' }}
              >
                <hr/>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
                  <path fill="currentColor" d="M32.3 18.3c0 .4 0 .8-.1 1.2l2.4-.9c.5.9 1.7 1.3 2.7 1 1.1-.4 1.7-1.7 1.3-2.9-.2-.6-.7-1.1-1.3-1.3.3-.5.3-1.2.1-1.8-.4-1.1-1.7-1.7-2.9-1.3-1 .4-1.6 1.4-1.4 2.5l-1.3.5c.4.9.5 1.9.5 3zM2.7 19.5c1 .4 2.2 0 2.7-1l2.4.9c0-.4-.1-.8-.1-1.2 0-1.1.1-2.1.4-3l-1.3-.5c.2-1-.4-2.1-1.4-2.5-1.1-.4-2.4.2-2.9 1.3-.2.6-.2 1.3.1 1.8-.6.2-1 .7-1.3 1.3-.4 1.2.2 2.5 1.4 2.9zM9 23.8l-3.7 1.4c-.5-.9-1.7-1.3-2.7-1-1.1.4-1.7 1.7-1.3 2.9.2.6.7 1.1 1.3 1.3-.3.5-.3 1.2-.1 1.8.4 1.1 1.7 1.7 2.9 1.3 1-.4 1.6-1.5 1.4-2.5l4.8-1.8c-1.1-1-1.9-2.1-2.6-3.4zM25.2 26.9l.8-.5c2.5-1.8 3.9-4.7 3.9-7.9 0-5.5-4.5-10-10-10s-10 4.5-10 10c0 3.2 1.6 6 3.8 7.8l.9.6c.2.1.3.4.2.7-.1.1-.3.2-.4.2-.1 0-.2 0-.3-.1l-.2-.1v2.6c0 .6.6 1 1.2 1h.4c.2 0 .4-.3.4-.6s.3-.7.7-.7c.4 0 .7.3.7.7 0 .4.4.7 1 .7s1-.3 1-.7.3-.7.8-.7.8.3.8.7c0 .4.4.7 1 .7s1-.3 1-.7c0-.4.3-.7.7-.7.4 0 .7.3.7.6 0 .4.2.6.4.6h.4c.6 0 1.3-.4 1.3-1v-2.6l-.3.1c-.1.1-.2.1-.3.1-.2 0-.3-.1-.4-.2-.4-.2-.4-.5-.2-.6zm-9.5-3.5c-1.8 0-3.3-1.5-3.3-3.3 0-.5.1-1 .4-1.5.2-.3.7-.3.7-.3l5.1.5s.2 0 .3.2c.1.4.2.7.2 1.1-.1 1.8-1.6 3.3-3.4 3.3zm5 3.3c-.3 0-.6-.2-.7-.5-.1.3-.4.5-.7.5-.5 0-.8-.4-.8-.9 0-.2.1-.4.2-.6 0 0 .3-.3.7-.8.2-.2.5-.3.7-.3.3 0 .5.1.7.3l.7.8c.1.2.2.4.2.6-.2.5-.6.9-1 .9zm3.9-3.3c-1.8 0-3.3-1.5-3.3-3.3 0-.4.1-.8.2-1.1.1-.2.3-.2.3-.2l5.1-.5s.5 0 .7.3c.2.5.4 1 .4 1.5-.1 1.8-1.6 3.3-3.4 3.3zM37.2 24.2c-1-.4-2.1 0-2.7.9l-3.6-1.4c-.6 1.3-1.5 2.4-2.5 3.4l4.7 1.8c-.2 1 .4 2.1 1.4 2.5 1.1.4 2.4-.1 2.9-1.3.2-.6.2-1.3-.1-1.8.6-.2 1-.7 1.3-1.3.3-1.1-.3-2.4-1.4-2.8z"/>
                </svg>
                <hr/>
              </span>
              <span
                sx={UITicket.styles.title}
                style={{ color: palette?.color || 'hsla(340, 20%, 10%, 0.65)' }}
              >
                Releases
              </span>
            </button>
          </span>
          <button
            title='Edit movie metadata (query terms and years, policy and keep-up-to-date option)'
            onClick={() => setExpanded(e => !e)}
            onMouseEnter={() => ready ? setHover(true) : null}
            onMouseLeave={() => ready ? setHover(false) : null}
            disabled={!ready}
            sx={{
              ...UITicket.styles.right,
              ':hover:not(:disabled)': {
                backgroundColor: palette?.backgroundColor ? (Color(palette?.backgroundColor).desaturate(0.15)[(Color(palette?.backgroundColor).luminosity() > 0.5 ? 'darken' : 'lighten')](0.05)).hexa() : 'hsla(347, 80%, 63%, 1)',
              },
              ':active:not(:disabled)': {
                backgroundColor: palette?.backgroundColor ? (Color(palette?.backgroundColor).desaturate(0.25)[(Color(palette?.backgroundColor).luminosity() > 0.5 ? 'darken' : 'lighten')](0.1)).hexa() : 'hsla(347, 70%, 60%, 1)',
              },
              ...(expanded ? {
                backgroundColor: palette?.backgroundColor ? (Color(palette?.backgroundColor).desaturate(0.25)[(Color(palette?.backgroundColor).luminosity() > 0.5 ? 'darken' : 'lighten')](0.1)).hexa() : 'hsla(347, 70%, 60%, 1)',
              } : {}),
            }}
            style={{
              borderColor: palette?.alternativeColor || 'hsla(347, 60%, 30%, 0.3)',
              color: palette?.accentColor || 'hsla(347, 20%, 34%, 0.34)',
            }}
          >
            <span sx={ready ? {} : { opacity: 0, animation: `1200ms ${animations.dots} 300ms infinite` }}>.</span>
            <span sx={ready ? {} : { opacity: 0, animation: `1200ms ${animations.dots} 200ms infinite` }}>.</span>
            <span sx={ready ? {} : { opacity: 0, animation: `1200ms ${animations.dots} infinite` }}>.</span>
          </button>
        </span>
      </div>
    </div>
  )
}

UITicket.styles = {
  element: {
    width: '100%',
    zIndex: 4,
    filter: `drop-shadow(-1px 1px 4px rgba(0, 0, 0, 0.2))`,
  },
  wrapper: {
    position: 'relative',
    width: '100%',
    padding: 8,
    ':disabled': {
      opacity: 0.5,
    },
    overflow: 'hidden',
    transition: 'opacity 400ms ease-in-out, background-color 400ms ease-in-out',
    mask: 'radial-gradient(0.5em at 0.5em 0.5em, #0000 98%, #000) -0.5em -0.5em',
  },
  container: {
    display: 'flex',
    border: '2px solid',
    transition: 'border-color 400ms ease-in-out',
    borderRadius: '0.5em',
    overflow: 'hidden',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    borderRight: '2px solid',
    transition: 'color 400ms ease-in-out, border-color 400ms ease-in-out',
    minWidth: '2em',
    padding: 10,
    fontSize: 7,
    fontWeight: 'strong',
    textTransform: 'uppercase',
    '>span': {
      transform: 'rotate(180deg)',
      writingMode: 'tb',
    },
  },
  center: {
    flex: 1,
    display: 'flex',
    '>button': {
      variant: 'button.reset',
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      flexDirection: 'column',
      padding: 8,
      fontFamily: 'heading',
      textTransform: 'uppercase',
    }
  },
  subtitle: {
    transition: 'color 400ms ease-in-out',
    fontWeight: 'semibold',
    fontSize: 5,
  },
  rule: {
    display: 'flex',
    alignItems: 'center',
    transition: 'color 400ms ease-in-out',
    width: '100%',
    paddingX: 6,
    '>hr': {
      flex: 1,
      border: 'none',
      borderBottom: '1px solid',
      margin: 12,
    },
    '>svg': {
      height: '1em',
      width: '1em',
      marginX: 8,
    },
  },
  title: {
    fontSize: 0,
    fontWeight: 'bold',
    transition: 'color 400ms ease-in-out',
  },
  right: {
    variant: 'button.reset',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '1.5em',
    borderLeft: '2px solid',
    transition: 'color 400ms ease-in-out, border-color 400ms ease-in-out',
    paddingRight: 8,
    fontSize: 6,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    '>span': {
      transform: 'rotate(180deg)',
      writingMode: 'tb',
    },
  },
}

const Ticket = memo(UITicket)

const UIPreferences = ({
  entity,
  metadata,
  setMetadata,
  expanded,
  hover,
  ...props
}) => {
  const sensorr = useSensorr()
  const query = useMemo(() => sensorr.getQuery(entity, metadata.query), [entity?.id, metadata.query])

  const values = useMemo(() => ({
    terms: [
      ...(query?._defaults?.terms || []).map(term => ({ value: term, label: term, pinned: true, disabled: !query?.terms?.includes(term) })),
      ...(query?.titles || []).filter(title => !(query?._defaults?.terms || []).includes(title)).map(title => ({ value: title, label: title, pinned: true, disabled: !(query?.terms || []).includes(title) })),
      ...(query?.terms || []).filter(term => !(query?._defaults?.terms || []).includes(term) && !(query?.titles || []).includes(term)).map(term => ({ value: term, label: term })),
    ],
    years: [
      ...(query?._defaults?.years || []).map(term => ({ value: term, label: term, pinned: true, disabled: !query?.years?.includes(term) })),
      ...(query?.years || []).filter(term => !query?._defaults?.years?.includes(term)).map(term => ({ value: term, label: term })),
    ],
  }), [query?._defaults, query?.titles, query])

  return (
    <div
      sx={{
        ...UIPreferences.styles.element,
        ...(expanded ? {
          top: '100%',
          left: '0em',
          marginTop: 8,
          height: '20em',
          transform: 'rotate(0deg)',
          transition: 'left 400ms ease-in-out, top 400ms ease-in-out, margin 400ms ease-in-out, transform 400ms ease-in-out, height 400ms ease-in-out 200ms',
          '>div': {
            opacity: 1,
            transition: 'opacity 200ms ease-in-out',
          },
        } : {
          top: '0%',
          left: '-1em',
          margin: 12,
          height: '6.125em',
          transform: 'rotate(-8deg)',
          transition: 'left 400ms ease-in-out 200ms, top 400ms ease-in-out 200ms, margin 400ms ease-in-out 200ms, transform 400ms ease-in-out 200ms, height 400ms ease-in-out',
          ...(hover ? { animation: `1s ${animations.shake} 400ms 2` } : {}),
          '>div>div': {
            opacity: 0,
            transition: 'opacity 200ms ease-in-out 400ms',
          },
        }),
      }}
    >
      <div sx={UIPreferences.styles.wrapper}>
        <div sx={UIPreferences.styles.head}>
          <hr/>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 70">
            <path fill='currentColor' d="M65 17.1h-3.3v-3.3H35v3.3h-3.3v3.3h-3.3v26.7h10v6.7h3.3v3.3H45v-3.3h3.3v3.3H55v-3.3h3.3v-6.7h10V20.5H65v-3.4zm-23.3 20v3.3H35v-10h10v6.7h-3.3zm10 10H45v-3.3h6.7v3.3zm10-6.6H55v-3.3h-3.3v-6.7h10v10zM88.3 17.1v-3.3H85v3.3h-3.3v3.3H75v3.3h-3.3v6.7h6.7v-3.3H85v-3.3h6.7v-3.3H95v-3.3l-6.7-.1zm0 3.4zM21.7 20.5H15v-6.7h-3.3v6.7H5v3.3h6.7v3.3H15v3.4h6.7v3.3H25v-10h-3.3zM85 50.5v-3.4h-6.7v-3.3h-6.6v6.7h6.6v3.3H85v6.7h3.3v-3.4h3.4v-6.6zM18.3 47.1h-6.6v3.4H5v3.3h3.3v6.6h3.4v-3.3H15v-3.3h3.3v-3.3H25v-6.7h-6.7z"/>
          </svg>
          <hr/>
        </div>
        <div sx={UIPreferences.styles.container}>
          <div sx={UIPreferences.styles.block}>
            <span>Terms</span>
            <QueryInput
              direction='column'
              value={values.terms}
              onChange={(values) => {
                setMetadata('query', {
                  ...metadata.query,
                  terms: values.filter(({ disabled }) => !disabled).map(({ value }) => value),
                })
              }}
            />
            <small>Sensorr will search for all selected terms on configured indexers</small>
          </div>
          <div sx={UIPreferences.styles.block}>
            <span>Years</span>
            <QueryInput
              value={values.years}
              onChange={(values) => {
                setMetadata('query', {
                  ...metadata.query,
                  years: values.filter(({ disabled }) => !disabled).map(({ value }) => value),
                })
              }}
            />
            <small>Sensorr will filter releases with selected years</small>
          </div>
          <div sx={UIPreferences.styles.block}>
            <span>Policy</span>
            <PolicyInput
              value={metadata?.policy}
              onChange={value => setMetadata('policy', value)}
            />
            <small>Sensorr will apply selected policy to sort and select the best release</small>
          </div>
          <div sx={UIPreferences.styles.block}>
            <span>Keep up to date</span>
            <KeepUpToDateInput
              id={entity?.id}
              value={metadata?.cared}
              onChange={value => {
                console.log('KeepUpToDateInput', { value })
                setMetadata('cared', value)
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

UIPreferences.styles = {
  element: {
    position: 'absolute',
    display: 'flex',
    width: '100%',
    zIndex: 3,
    filter: `drop-shadow(-1px 1px 4px rgba(0, 0, 0, 0.2))`,
  },
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    backgroundColor: 'hsla(0, 0%, 98%, 1)',
    color: 'blackPure',
    paddingY: 4,
    paddingTop: 12,
    mask: 'radial-gradient(0.5em at 0.5em 0.5em, #0000 98%, #000) -0.5em -0.5em',
  },
  head: {
    display: 'flex',
    alignItems: 'center',
    color: 'gray-300',
    width: '100%',
    paddingX: 0,
    paddingTop: 10,
    '>hr': {
      flex: 1,
      border: 'none',
      borderBottom: '1px solid',
      margin: 12,
    },
    '>svg': {
      height: '2em',
      width: '2em',
      marginX: 8,
    },
  },
  container: {
    overflowY: 'auto',
  },
  block: {
    display: 'flex',
    flexDirection: 'column',
    paddingY: 8,
    paddingX: 2,
    '>span': {
      fontWeight: 'semibold',
      fontSize: 7,
      color: 'gray-600',
    },
    '>small': {
      display: 'block',
      marginTop: 10,
      fontSize: 7,
      color: 'gray-500',
    },
  }
}

const Preferences = memo(UIPreferences)

const UIQueryInput = ({ value, onChange, direction = 'row', ...props }) => {
  const { theme } = useThemeUI()

  const ref = useRef()
  const styles = useMemo(() => ({
    container: (style) => ({
      ...style,
      flex: 1,
      overflow: 'hidden',
      margin: '0px',
    }),
    control: (style) => ({
      ...style,
      backgroundColor: 'transparent',
      border: 'none',
      boxShadow: 'none',
      cursor: 'text',
      minHeight: 'unset',
      '>div:first-of-type': {
        display: 'flex',
        padding: '0px 0.25em',
      }
    }),
    input: (style) => ({
      ...style,
      flex: 1,
      color: 'inherit',
      fontSize: '1em',
      textAlign: 'left',
      marginLeft: '0.25em',
      '>div>input': {
        fontSize: '0.75em !important',
        fontFamily: (theme.fonts as any).body,
      },
    }),
    valueContainer: (style) => ({
      ...style,
      padding: '0.25em !important',
      flexWrap: { row: 'nowrap', column: 'wrap' }[direction] || 'wrap',
      ...({
        row: {
          overflowX: 'auto',
        },
        column: {
          overflow: 'auto',
          maxHeight: '8em',
        },
      }[direction]),
    }),
    multiValue: (style, { data: { pinned, disabled } }) => ({
      ...style,
      position: 'relative',
      flexShrink: 0,
      backgroundColor: pinned ? disabled ? theme.rawColors['gray-300'] : theme.rawColors.accent : theme.rawColors.accentDarkest,
      color: theme.rawColors.whitePure,
      border: pinned ? `1px solid ${disabled ? theme.rawColors['gray-300'] : theme.rawColors.accent}` : 'none',
      marginRight: '0.25em',
      opacity: disabled ? 0.75 : 1,
      ':hover': {
        opacity: disabled ? 0.9 : 1,
      },
    }),
    multiValueLabel: (style, { data: { pinned, disabled } }) => ({
      ...style,
      color: theme.rawColors.whitePure,
      fontSize: '0.75em',
      fontFamily: (theme.fonts as any).body,
      fontWeight: 600,
      paddingRight: pinned ? '6px' : '0px',
    }),
    multiValueRemove: (style, { data: { pinned } }) => (pinned ? {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      cursor: 'pointer',
      opacity: 0,
    } : {
      ...style,
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
      borderLeft: `1px solid ${theme.rawColors.whitePure}`,
      marginLeft: '0.25em',
      cursor: 'pointer',
      ':hover': {
        backgroundColor: theme.rawColors.accentDarker,
      },
    }),
  }), [theme.rawColors, theme.fonts])

  return (
    <div
      sx={{
        display: 'flex',
        flexDirection: direction,
        marginY: 10,
        '>div': {
          flex: 1,
          border: '1px solid',
          borderColor: 'gray-500',
          overflow: 'hidden',
          ...({
            row: {
              borderTopLeftRadius: '0.25em',
              borderBottomLeftRadius: '0.25em',
              borderRight: 'none',
            },
            column: {
              borderTopLeftRadius: '0.25em',
              borderTopRightRadius: '0.25em',
              borderBottom: 'none',
            },
          }[direction]),
        },
        '>button': {
          variant: 'button.reset',
          backgroundColor: 'primaryDark',
          color: 'whitePure',
          '&:hover': {
            backgroundColor: 'primaryDarker'
          },
          '&:active': {
            backgroundColor: 'primaryDarkest'
          },
          ...({
            row: {
              paddingX: 8,
              borderTopRightRadius: '0.25em',
              borderBottomRightRadius: '0.25em',
            },
            column: {
              paddingY: 8,
              borderTop: '1px solid',
              borderColor: 'primaryDarkest',
              borderBottomLeftRadius: '0.25em',
              borderBottomRightRadius: '0.25em',
            },
          }[direction]),
        },
      }}
    >
      <div>
        <QuerySelect
          ref={ref}
          options={[]}
          isClearable={false}
          defaultOptions={true}
          resetable={false}
          direction='column'
          value={value}
          onChange={onChange}
          styles={styles}
        />
      </div>
      <button onClick={() => (ref as any).current?.focus()}>+</button>
    </div>
  )
}

export const QueryInput = memo(UIQueryInput)

const UIPolicyInput = ({ value, onChange, ...props }) => {
  const sensorr = useSensorr()

  return (
    <label htmlFor='policy' sx={UIPolicyInput.styles.element}>
      <select
        id='policy'
        value={value?.name}
        onChange={e => onChange(e.currentTarget.value)}
      >
        {sensorr.policies.map(policy => (
          <option key={policy.name} value={policy.name}>
            {(policy.name || '').charAt(0).toUpperCase()}{(policy.name || '').slice(1)}
          </option>
        ))}
      </select>
      <span sx={UIPolicyInput.styles.container}>
        <span>{value?.name || 'default'}</span>
      </span>
      <span sx={UIPolicyInput.styles.button}>
        <Icon value='chevron' direction={false} width='0.625em' height='0.625em' />
      </span>
    </label>
  )
}

UIPolicyInput.styles = {
  element: {
    position: 'relative',
    display: 'flex',
    marginY: 10,
    '>select': {
      variant: 'select.reset',
      position: 'absolute',
      opacity: 0,
      top: '0em',
      left: '0em',
      height: '100%',
      width: '100%',
      '>option': {
        textTransform: 'capitalize',
      },
    },
  },
  container: {
    display: 'flex',
    flex: 1,
    padding: 10,
    borderRadius: '0.25em',
    border: '1px solid',
    borderColor: 'gray-500',
    borderRight: 'none',
    borderTopRightRadius: '0em',
    borderBottomRightRadius: '0em',
    '>span': {
      display: 'block',
      borderRadius: '2px',
      color: 'whitePure',
      fontSize: 6,
      paddingY: '3px',
      paddingX: '6px',
      margin: '2px',
      border: '1px solid',
      borderColor: 'accent',
      fontFamily: 'body',
      fontWeight: 'semibold',
      backgroundColor: 'accent',
    },
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingX: 8,
    backgroundColor: 'primaryDark',
    color: 'whitePure',
    borderTopRightRadius: '0.25em',
    borderBottomRightRadius: '0.25em',
    '&:hover': {
      backgroundColor: 'primaryDarker'
    },
    '&:active': {
      backgroundColor: 'primaryDarkest'
    },
  },
}

export const PolicyInput = memo(UIPolicyInput)

const UIKeepUpToDateInput = ({ id, value, onChange, ...props }) => {
  const styles = useMemo(() => ({
    element: {
      display: 'flex',
      alignItems: 'center',
      marginY: 10,
      '>label': {
        marginRight: 8,
        color: value ? 'accentDark' : 'gray-550',
        transition: 'color 200ms ease-in-out',
      },
      '>small': {
        fontSize: 7,
        color: 'gray-500',
      },
    },
  }), [value])

  return (
    <div sx={styles.element}>
      <Option
        id={`keep-up-to-date-${id}`}
        type='checkbox'
        checked={value}
        onChange={(e: any) => onChange(!!e.target.checked)}
      />
      <small>Sensorr will regularly search for better releases than the current archived one</small>
    </div>
  )
}

export const KeepUpToDateInput = memo(UIKeepUpToDateInput)
