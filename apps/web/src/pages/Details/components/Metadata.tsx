import { memo, useMemo, useRef } from 'react'
import { Policy } from '@sensorr/sensorr'
import { Icon, QuerySelect, Option } from '@sensorr/ui'
import { useSensorr } from '../../../store/sensorr'
import { useThemeUI } from 'theme-ui'

const UIMetadata = ({ entity, metadata, setMetadata, help = true, ...props }) => {
  const sensorr = useSensorr()
  const query = useMemo(() => sensorr.getQuery(entity, metadata.query), [entity?.id, metadata.query])
  const policy = useMemo(() => (!metadata.policy || typeof metadata.policy === 'string') ? new Policy(metadata.policy || '', sensorr.policies) : metadata.policy, [metadata.policy, sensorr.policies])

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
    <div>
      <div sx={UIMetadata.styles.container}>
        <div sx={{ ...UIMetadata.styles.block, flex: 1, overflow: 'hidden' }}>
          <span>Terms</span>
          <QueryInput
            value={values.terms}
            onChange={(values) => {
              setMetadata('query', {
                ...metadata.query,
                terms: values.filter(({ disabled }) => !disabled).map(({ value }) => value),
              })
            }}
          />
          {help && <small title="Sensorr will search for all selected terms on configured indexers">Sensorr will search for all selected terms on configured indexers</small>}
        </div>
        <div sx={{ ...UIMetadata.styles.block, flex: 0, minWidth: '12em' }}>
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
          {help && <small title="Sensorr will filter releases with selected years">Sensorr will filter releases with selected years</small>}
        </div>
        <div sx={{ ...UIMetadata.styles.block, flex: 0, minWidth: '12em' }}>
          <span>Policy</span>
          <PolicyInput
            value={policy}
            onChange={value => setMetadata('policy', value)}
          />
          {help && <small title="Sensorr will apply selected policy to sort and select the best release">Sensorr will apply selected policy to sort and select the best release</small>}
        </div>
      </div>
      {help && (
        <div sx={UIMetadata.styles.container}>
          <div sx={{ ...UIMetadata.styles.block, flexBasis: 0, whiteSpace: ['wrap', 'nowrap'] }}>
            <span>Refine for better release</span>
            <OptionInput
              id={`refine-${entity?.id}`}
              children="Sensorr will regularly search for better release than the current archived one"
              value={metadata?.refine}
              onChange={value => setMetadata('refine', value)}
            />
          </div>
          <div sx={{ ...UIMetadata.styles.block, flexBasis: 0, whiteSpace: ['wrap', 'nowrap'] }}>
            <span>Shrink for smaller release</span>
            <OptionInput
              id={`shrink-${entity?.id}`}
              children="Sensorr will regularly search for smaller release than the current archived one"
              value={metadata?.shrink}
              onChange={value => setMetadata('shrink', value)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

UIMetadata.styles = {
  container: {
    display: 'flex',
    flexDirection: ['column', 'row'],
  },
  block: {
    display: 'flex',
    flexDirection: 'column',
    flexBasis: '40rem',
    paddingY: 8,
    paddingX: [8, 2],
    whiteSpace: 'nowrap',
    '&:first-of-type': {
      paddingLeft: [8, 12],
    },
    '&:last-of-type': {
      paddingRight: [8, 12],
    },
    '>span': {
      fontWeight: 'semibold',
      fontSize: 7,
      color: 'gray-600',
    },
    '>small': {
      display: 'block',
      marginTop: 10,
      marginBottom: 10,
      fontSize: 7,
      color: 'gray-500',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
  }
}

export const Metadata = memo(UIMetadata)

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
      borderLeft: `1px solid ${theme.rawColors.whiteDarkest}`,
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

const UIOptionInput = ({ id, value, onChange, children, ...props }) => {
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
      <small>{children}</small>
    </div>
  )
}

export const OptionInput = memo(UIOptionInput)
