import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { components } from 'react-select'
import { DndContext, MouseSensor, TouchSensor, pointerWithin, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core'
import { useThemeUI } from 'theme-ui'
import { Select } from './Select'

const colors = (theme) => ({
  prefer: theme.rawColors.primaryDarker,
  avoid: theme.rawColors.error,
  current: theme.rawColors.accentDarkest,
  proposed: theme.rawColors.primaryDarker,
})

// With `rankable`, a ⭐ prefer value dropped on the middle of another joins its rank; dropped on an edge it
// moves before or after it, and joins the rank of the two values it lands between when they share one
const RANKED = 'prefer'

const dropContext = createContext({ active: null, target: null })

const sameRank = (a, b) => !!a && !!b && a.group === RANKED && b.group === RANKED && a.rank !== undefined && a.rank === b.rank

const zoneOf = ({ active, over, activatorEvent, delta }, rankable) => {
  const x = (activatorEvent.touches?.[0] ?? activatorEvent).clientX + delta.x
  const ratio = (x - over.rect.left) / over.rect.width
  const grouping = rankable && active.data.current.group === RANKED && over.data.current.group === RANKED

  return (grouping && ratio > 0.3 && ratio < 0.7) ? 'rank' : ratio < 0.5 ? 'before' : 'after'
}

const MultiValue = (props) => {
  const { theme } = useThemeUI()
  const { active, target, requirable } = useContext(dropContext) as any
  const id = props.data.value
  const draggable = useDraggable({ id: `${id}`, data: props.data, disabled: typeof id === 'undefined' })
  const droppable = useDroppable({ id: `${id}`, data: props.data, disabled: typeof id === 'undefined' })

  // prevents menu from being opened/closed when the user clicks on a value to begin dragging it.
  const onMouseDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  if (typeof id === 'undefined') {
    return (
      <components.MultiValue {...props} innerProps={{ ...props.innerProps, onMouseDown, title: props.data.title }} />
    )
  }

  const values = props.selectProps.value
  const index = values.findIndex(v => v.value === id)
  const joined = { left: sameRank(values[index - 1], props.data), right: sameRank(props.data, values[index + 1]) }
  const ranked = joined.left || joined.right
  const zone = target?.id === `${id}` && active !== `${id}` ? target.zone : null
  const setNodeRef = (node) => {
    draggable.setNodeRef(node)
    droppable.setNodeRef(node)
  }

  return (
    <div
      sx={{
        display: 'flex',
        alignItems: 'stretch',
        marginY: '0.25em',
        marginLeft: joined.left ? '0px' : '0.25em',
        marginRight: joined.right ? '0px' : '0.25em',
        ...(ranked ? {
          padding: '0.25em',
          paddingLeft: joined.left ? '0px' : '0.25em',
          marginY: '0px',
          border: '1px solid',
          borderColor: 'primary',
          borderLeftWidth: joined.left ? '0px' : '1px',
          borderRightWidth: joined.right ? '0px' : '1px',
          borderRadius: '2px',
          borderTopLeftRadius: joined.left ? '0px' : '2px',
          borderBottomLeftRadius: joined.left ? '0px' : '2px',
          borderTopRightRadius: joined.right ? '0px' : '2px',
          borderBottomRightRadius: joined.right ? '0px' : '2px',
        } : {}),
      }}
    >
      <div
        ref={setNodeRef}
        title={zone === 'rank' ? `Same rank as ${id}` : undefined}
        sx={{
          display: 'flex',
          alignItems: 'stretch',
          position: 'relative',
          border: `1px solid`,
          borderColor: colors(theme)[props.data.group] || '#FFF',
          borderRadius: '2px',
          opacity: active === `${id}` ? 0.4 : 1,
          outline: zone === 'rank' ? '2px dashed' : 'none',
          outlineColor: 'primary',
          outlineOffset: '2px',
          '::before': zone === 'before' || zone === 'after' ? {
            content: '""',
            position: 'absolute',
            top: '-0.25em',
            bottom: '-0.25em',
            [zone === 'before' ? 'left' : 'right']: 'calc(-0.25em - 2px)',
            width: '2px',
            backgroundColor: 'primary',
          } : {},
        }}
      >
        {requirable && [RANKED, null].includes(props.data.group) && (
          <div
            title={props.data.required ? `Required` : `Non Required`}
            onClick={() => {
              props.selectProps.onChange(
                props.selectProps.value.map(data => ({ ...data, ...(data.value === props.data.value ? { required: !data.required } : {}) })),
                { action: 'toggle-require-value', removedValue: { ...props.data, required: !props.data.required } }
              )
            }}
            sx={{
              backgroundColor: { prefer: theme.rawColors.accentDark }[props.data.group] || '#FFF',
              paddingX: 10,
              color: props.data.required ? ({ prefer: '#FFF' }[props.data.group] || theme.rawColors.primaryDarker) : ({ prefer: theme.rawColors.accentDarkest }[props.data.group] || theme.rawColors.textDarkest),
              cursor: 'pointer',
              ':hover': {
                backgroundColor: { prefer: theme.rawColors.accentDarker }[props.data.group] || theme.rawColors.textDark,
              },
            }}
          >
            ＊
          </div>
        )}
        <components.MultiValue
          {...props}
          innerProps={{ ...props.innerProps, onMouseDown }}
          removeProps={{ ...props.removeProps, ...draggable.listeners }}
        />
      </div>
    </div>
  )
}

const SortableComponents = { MultiValue }

export const SortableSelect = ({ value, onChange, requirable = false, rankable = false, ...props }) => {
  const { theme } = useThemeUI()
  const [active, setActive] = useState(null)
  const [target, setTarget] = useState(null)
  const dragging = useRef(false)
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  )

  const release = useCallback(() => {
    setActive(null)
    setTarget(null)
    setTimeout(() => { dragging.current = false }, 100)
  }, [])

  const onDragMove = useCallback((event) => {
    setTarget(event.over && event.over.id !== event.active.id ? { id: event.over.id, zone: zoneOf(event, rankable) } : null)
  }, [rankable])

  const onDragEnd = useCallback((event) => {
    release()

    if (!event.over || event.over.id === event.active.id) {
      return
    }

    const zone = zoneOf(event, rankable)
    const moved = value.find(v => `${v.value}` === event.active.id)
    const rest = value.filter(v => v !== moved)
    const over = rest.findIndex(v => `${v.value}` === event.over.id)
    const at = zone === 'before' ? over : over + 1
    const rank = zone === 'rank' ?
      (rest[over].rank ?? `${rest[over].value}`) :
      (sameRank(rest[at - 1], rest[at]) && moved.group === RANKED ? rest[at].rank : undefined)
    const next = [
      ...rest.slice(0, at).map((v, index) => (zone === 'rank' && index === over) ? { ...v, rank } : v),
      { ...moved, rank },
      ...rest.slice(at),
    ]

    onChange(next.filter(v => v.value))
  }, [value, onChange, rankable, release])

  // A drop ends on a pointer up, which must not also cycle the value it lands on
  const handleChange = useCallback((values, meta) => {
    if (dragging.current && ['remove-value', 'pop-value'].includes(meta?.action)) {
      return
    }

    onChange(values, meta)
  }, [onChange])

  const styles = useMemo(() => ({
    control: (style) => ({
      ...style,
      backgroundColor: 'transparent',
      borderColor: 'inherit !important',
      boxShadow: 'none',
      '>div:first-of-type': {
        display: 'flex',
        padding: '0.5em',
      }
    }),
    input: () => ({
      display: 'none',
    }),
    multiValue: (style, { data: { value, group, separator } }) => (value ? {
      ...style,
      position: 'relative',
      flexShrink: 0,
      backgroundColor: colors(theme)[group] || 'transparent',
      color: '#FFF',
      margin: '0px',
      zIndex: 5,
      borderRadius: '0px',
    } : separator ? {
      position: 'relative',
      flex: 1,
      flexBasis: '100%',
      height: '4px',
      '>div:last-of-type': {
        display: 'none',
      },
    } : {
      position: 'relative',
      '>div:first-of-type': {
        fontSize: '1em !important',
        paddingRight: '8px',
      },
      '>div:last-of-type': {
        display: 'none',
      },
    }),
    multiValueLabel: (style) => ({
      ...style,
      color: '#FFF',
      fontSize: '0.75em',
      fontFamily: (theme.fonts as any).monospace,
      fontWeight: 600,
      paddingRight: '6px',
    }),
    multiValueRemove: () => ({
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      cursor: 'pointer',
      opacity: 0,
    }),
    loadingIndicator: () => ({
      display: 'none',
    }),
    dropdownIndicator: () => ({
      display: 'none',
    }),
    menu: () => ({
      display: 'none',
    }),
  }), [theme])

  return (
    <dropContext.Provider value={{ active, target, requirable } as any}>
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={(event) => { dragging.current = true; setActive(event.active.id) }}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
        onDragCancel={release}
      >
        <Select
          {...props}
          value={value}
          onChange={handleChange}
          closeMenuOnSelect={false}
          multi={true}
          styles={styles}
          components={SortableComponents}
        />
      </DndContext>
    </dropContext.Provider>
  )
}
