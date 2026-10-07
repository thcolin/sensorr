import { memo, useId, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { entryPolicy, Policy } from '@sensorr/sensorr'
import { Bar, Icon, QuerySelect, Option } from '@sensorr/ui'
import { useSensorr } from '../../../store/sensorr'
import { useCustomLists } from '../../../components/Lists/useCustomLists'
import { useThemeUI } from 'theme-ui'

export const termsValuesOf = (query) => [
  ...(query?._defaults?.terms || []).map(term => ({ value: term, label: term, pinned: true, disabled: !query?.terms?.includes(term) })),
  ...(query?.titles || []).filter(title => !(query?._defaults?.terms || []).includes(title)).map(title => ({ value: title, label: title, pinned: true, disabled: !(query?.terms || []).includes(title) })),
  ...(query?.terms || []).filter(term => !(query?._defaults?.terms || []).includes(term) && !(query?.titles || []).includes(term)).map(term => ({ value: term, label: term })),
]

const UIMetadata = ({ entity, metadata, setMetadata, help = true, lists = false, ...props }) => {
  const { t } = useTranslation()
  const sensorr = useSensorr()
  const query = useMemo(() => sensorr.getQuery(entity, metadata.query), [entity?.id, metadata.query])
  const policy = useMemo(() => (!metadata.policy || typeof metadata.policy === 'string') ? new Policy(metadata.policy || entryPolicy({ original_language: entity?.original_language }, metadata, sensorr.policies)?.name || '', sensorr.policies) : metadata.policy, [metadata.policy, metadata.state, entity?.original_language, sensorr.policies])

  const ids = { terms: useId(), years: useId() }

  const values = useMemo(() => ({
    terms: termsValuesOf(query),
    years: [
      ...(query?._defaults?.years || []).map(term => ({ value: term, label: term, pinned: true, disabled: !query?.years?.includes(term) })),
      ...(query?.years || []).filter(term => !query?._defaults?.years?.includes(term)).map(term => ({ value: term, label: term })),
    ],
  }), [query?._defaults, query?.titles, query])

  return (
    <div>
      <div sx={lists ? { ...UIMetadata.styles.container, ...UIMetadata.styles.listed } : UIMetadata.styles.container}>
        <div sx={{ ...UIMetadata.styles.block, ...UIMetadata.styles.wide, ...UIMetadata.styles.line }}>
          <span id={ids.terms}>{t('sensorr.terms.label')}</span>
          <QueryInput
            aria-labelledby={ids.terms}
            value={values.terms}
            onChange={(values) => {
              setMetadata('query', {
                ...metadata.query,
                terms: values.filter(({ disabled }) => !disabled).map(({ value }) => value),
              })
            }}
          />
          {help && <small title={t('sensorr.terms.help')}>{t('sensorr.terms.help')}</small>}
        </div>
        <div sx={{ ...UIMetadata.styles.block, ...UIMetadata.styles.column }}>
          <span id={ids.years}>{t('sensorr.years.label')}</span>
          <QueryInput
            aria-labelledby={ids.years}
            value={values.years}
            onChange={(values) => {
              setMetadata('query', {
                ...metadata.query,
                years: values.filter(({ disabled }) => !disabled).map(({ value }) => value),
              })
            }}
          />
          {help && <small title={t('sensorr.years.help')}>{t('sensorr.years.help')}</small>}
        </div>
        {lists && (
          <ListsInput
            media='movie'
            value={metadata?.lists}
            onChange={(lists) => setMetadata('lists', lists)}
          />
        )}
        <div sx={{ ...UIMetadata.styles.block, ...UIMetadata.styles.column }}>
          <span>{t('sensorr.policy.label')}</span>
          <PolicyInput
            value={policy}
            onChange={value => setMetadata('policy', value)}
          />
          {help && <small title={t('details.preferences.policy')}>{t('details.preferences.policy')}</small>}
        </div>
        {help && (
          <div sx={UIMetadata.styles.options}>
            <div sx={{ ...UIMetadata.styles.block, ...UIMetadata.styles.option }}>
              <span>{t('details.preferences.refine.label')}</span>
              <OptionInput
                id={`refine-${entity?.id}`}
                children={t('details.preferences.refine.help')}
                value={metadata?.refine}
                onChange={value => setMetadata('refine', value)}
              />
            </div>
            <div sx={{ ...UIMetadata.styles.block, ...UIMetadata.styles.option }}>
              <span>{t('details.preferences.shrink.label')}</span>
              <OptionInput
                id={`shrink-${entity?.id}`}
                children={t('details.preferences.shrink.help')}
                value={metadata?.shrink}
                onChange={value => setMetadata('shrink', value)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

UIMetadata.styles = {
  // One row from the second breakpoint, one column below the first. In between, two 12em columns would
  // squeeze Terms down to nothing: the row wraps, Terms on a line of its own and the other fields under it
  container: {
    display: ['grid', 'flex', 'grid'],
    flexWrap: 'wrap',
    gridTemplateColumns: ['minmax(0, 1fr)', 'minmax(0, 1fr) 12em 12em'],
    columnGap: 0,
  },
  block: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    paddingY: 8,
    paddingX: [8, 12],
    whiteSpace: 'nowrap',
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
      whiteSpace: ['normal', 'nowrap'],
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
  },
  wide: {
    overflow: 'hidden',
  },
  // With Lists, two columns from the first breakpoint: Terms | Years, Lists | Policy, then the options
  listed: {
    display: 'grid',
    gridTemplateColumns: ['minmax(0, 1fr)', 'minmax(0, 2fr) minmax(12em, 1fr)'],
  },
  // Once the row wraps, Terms and each option take a line of their own, and Years and Policy share one
  // from the width of their column
  line: {
    flexBasis: [null, '100%'],
  },
  column: {
    flex: [null, '1 1 12em'],
  },
  // The two options on a line of their own, half of it each
  options: {
    display: 'grid',
    gridTemplateColumns: ['minmax(0, 1fr)', 'repeat(2, minmax(0, 1fr))'],
    gridColumn: '1 / -1',
    flexBasis: '100%',
  },
  // An option's text wraps rather than run under its neighbour when its column is narrower than it
  option: {
    whiteSpace: 'normal',
  },
  fieldset: {
    minWidth: 0,
    margin: 12,
    padding: 12,
    border: 'none',
    transition: 'opacity 200ms ease-in-out',
    ':disabled': {
      opacity: 0.5,
    },
  },
}

export const Metadata = memo(UIMetadata)

// The editor while the movie loads, on its own grid and in its own blocks: a bar in each label and help text, at
// their font size, and a bar per field on the field's visible frame, measured: 37px under a 4px gap, 36px for
// Policy, an option's checkbox 16px
export const MetadataPlaceholder = ({ lists = false }) => {
  const field = (label, top, height, help, line = false) => (
    <div sx={{ ...UIMetadata.styles.block, ...(line ? UIMetadata.styles.line : UIMetadata.styles.column) }}>
      <span><Bar inline={true} width={`${label}em`} height='1em' /></span>
      <div sx={MetadataPlaceholder.styles.field}><Bar height={height} sx={{ marginTop: top }} /></div>
      <small><Bar inline={true} width={`${help}em`} height='1em' /></small>
    </div>
  )
  const option = (label, text) => (
    <div sx={UIMetadata.styles.block}>
      <span><Bar inline={true} width={`${label}em`} height='1em' /></span>
      <div sx={MetadataPlaceholder.styles.option}>
        <Bar width='1em' height='1em' />
        <Bar width={`${text}em`} height='0.625em' />
      </div>
    </div>
  )

  // Under the summary, as the editor's panel: 8px above the fields, its 1px rule under them
  return (
    <div sx={{ paddingTop: '0.5em' }}>
      <div sx={lists ? { ...UIMetadata.styles.container, ...UIMetadata.styles.listed } : UIMetadata.styles.container}>
        {field(3, '0.25em', '2.3125em', 30, true)}
        {field(2.75, '0.25em', '2.3125em', 21)}
        {lists && field(2.25, '0.25em', '2.3125em', 15, true)}
        {field(2.75, '0.25em', '2.25em', 31)}
        <div sx={UIMetadata.styles.options}>
          {option(12, 22.25)}
          {option(12.5, 22.625)}
        </div>
      </div>
      <Bar height='1px' radius='0px' />
    </div>
  )
}

MetadataPlaceholder.styles = {
  // From under the label to the help text, as the fields' own boxes and margins leave it
  field: {
    display: 'block',
    height: '2.8125em',
  },
  option: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5em',
    height: '2em',
    marginY: '0.25em',
  },
}

export const MetadataStyles = UIMetadata.styles

// The custom lists of a movie or a show; a name typed starts a new one
const UIListsInput = ({ media, value = [], onChange, disabled = false }) => {
  const { t } = useTranslation()
  const { lists, idsOf } = useCustomLists(media)
  const options = useMemo(() => lists.map((list) => ({ value: list.id, label: list.name })), [lists])
  const id = useId()

  return (
    <div sx={{ ...UIMetadata.styles.block, ...UIMetadata.styles.wide, ...UIMetadata.styles.line }}>
      <span id={id}>{t('lists.action.label')}</span>
      <fieldset disabled={disabled} aria-labelledby={id} sx={UIMetadata.styles.fieldset}>
        <QueryInput
          options={options}
          placeholder={t('details.lists.placeholder')}
          aria-labelledby={id}
          value={options.filter((option) => (value || []).includes(option.value))}
          // The metadata contexts tell a failure in their toast
          onChange={(values) => idsOf(values).then(onChange).catch(() => null)}
        />
      </fieldset>
      <small title={t('details.lists.help')}>{t('details.lists.help')}</small>
    </div>
  )
}

export const ListsInput = memo(UIListsInput)

const UIQueryInput = ({ value, onChange, direction = 'row', options = [], placeholder = '', ...props }) => {
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
    placeholder: (style) => ({
      ...style,
      marginLeft: '0.25em',
      fontSize: '0.75em',
      fontFamily: (theme.fonts as any).body,
      color: theme.rawColors['gray-500'],
    }),
    valueContainer: (style) => ({
      ...style,
      padding: '0.25em !important',
      flexWrap: { row: 'nowrap', column: 'wrap' }[direction] || 'wrap',
      ...({
        row: {
          overflowX: 'auto',
          overflowY: 'hidden',
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
          options={options}
          isClearable={false}
          defaultOptions={true}
          resetable={false}
          direction='column'
          placeholder={placeholder}
          aria-labelledby={props['aria-labelledby']}
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
  const { t } = useTranslation()
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
        <span>{value?.name || t('details.preferences.defaultPolicy')}</span>
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

const UIOptionInput = ({ id, value, onChange, children, disabled = false, ...props }) => {
  const styles = useMemo(() => ({
    // Centred with its checkbox on a phone, as the rest of the editor there
    element: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: ['center', 'flex-start'],
      marginY: 10,
      ...(disabled ? { opacity: 0.5 } : {}),
      '>label': {
        marginRight: 8,
        color: value ? 'accentDark' : 'gray-550',
        transition: 'color 200ms ease-in-out',
      },
      '>small': {
        flex: ['0 1 auto', 1],
        fontSize: 7,
        color: 'gray-500',
      },
    },
  }), [value, disabled])

  return (
    <div sx={styles.element}>
      <Option
        {...props}
        id={`keep-up-to-date-${id}`}
        type='checkbox'
        checked={value}
        disabled={disabled}
        onChange={(e: any) => onChange(!!e.target.checked)}
      />
      <small id={`keep-up-to-date-${id}-help`}>{children}</small>
    </div>
  )
}

export const OptionInput = memo(UIOptionInput)
