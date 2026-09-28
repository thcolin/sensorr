import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { components } from 'react-select'
import { DndContext, DragOverlay, MouseSensor, TouchSensor, closestCenter, pointerWithin, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core'
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

// A pointer in a gap between values drops next to the closest one, as long as it stays among them
const collide = (args) => {
  const within = pointerWithin(args)
  const point = args.pointerCoordinates
  const rects = [...args.droppableRects.values()]

  if (within.length || !point || !rects.length) {
    return within
  }

  const inside = point.x >= Math.min(...rects.map(r => r.left)) && point.x <= Math.max(...rects.map(r => r.right)) &&
    point.y >= Math.min(...rects.map(r => r.top)) && point.y <= Math.max(...rects.map(r => r.bottom))

  return inside ? closestCenter(args) : []
}

export const drop = (values, active, over, zone, fresh) => {
  const moved = values.find(v => `${v.value}` === active)
  const rest = values.filter(v => v !== moved)
  const index = rest.findIndex(v => `${v.value}` === over)
  const at = zone === 'before' ? index : index + 1
  const rank = zone === 'rank' ?
    (rest[index].rank ?? fresh) :
    (moved.group === RANKED && sameRank(rest[at - 1], rest[at]) ? rest[at].rank : undefined)

  return [
    ...rest.slice(0, at).map((v, i) => (zone === 'rank' && i === index) ? { ...v, rank } : v),
    { ...moved, rank },
    ...rest.slice(at),
  ]
}

const MultiValue = (props) => {
  const { theme } = useThemeUI()
  const { active, dragged, target, requirable } = useContext(dropContext) as any
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

  const zone = target?.id === `${id}` && active !== `${id}` ? target.zone : null
  const setNodeRef = (node) => {
    draggable.setNodeRef(node)
    droppable.setNodeRef(node)
  }

  return (
    <div sx={{ display: 'flex', alignItems: 'stretch', margin: '0.25em' }}>
      <div
        ref={setNodeRef}
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
            [zone === 'before' ? 'left' : 'right']: 'calc(-0.25em - 1px)',
            width: '2px',
            backgroundColor: dragged?.group === 'avoid' ? 'error' : 'primary',
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

// Neighbours of one ⭐ prefer rank are drawn inside one box, which wraps with them
const ValueContainer = ({ children, ...props }) => {
  const [values, ...rest] = children
  const runs = Array.isArray(values) ? values.reduce((runs, element) => {
    const run = runs[runs.length - 1]
    return (run && sameRank(run[run.length - 1].props.data, element.props.data)) ? [...runs.slice(0, -1), [...run, element]] : [...runs, [element]]
  }, []) : null

  return (
    <components.ValueContainer {...props as any}>
      {runs ? runs.map(run => run.length === 1 ? run[0] : (
        <div
          key={`rank-${run[0].key}`}
          sx={{
            display: 'inline-flex',
            flexWrap: 'wrap',
            marginX: '0.125em',
            border: '1px solid',
            borderColor: 'accentDarkest',
            borderRadius: '0.25em',
          }}
        >
          {run}
        </div>
      )) : values}
      {rest}
    </components.ValueContainer>
  )
}

const SortableComponents = { MultiValue, ValueContainer }

export const SortableSelect = ({ value, onChange, requirable = false, rankable = false, ...props }) => {
  const { theme } = useThemeUI()
  const [active, setActive] = useState(null)
  const [dragged, setDragged] = useState(null)
  const [target, setTarget] = useState(null)
  const dragging = useRef(false)
  const fresh = useRef(0)
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  )

  const release = useCallback(() => {
    setActive(null)
    setDragged(null)
    setTarget(null)
    setTimeout(() => { dragging.current = false }, 100)
  }, [])

  const onDragMove = useCallback((event) => {
    const next = event.over && event.over.id !== event.active.id ? { id: event.over.id, zone: zoneOf(event, rankable) } : null
    setTarget(previous => (previous?.id === next?.id && previous?.zone === next?.zone) ? previous : next)
  }, [rankable])

  const context = useMemo(() => ({ active, dragged, target, requirable }), [active, dragged, target, requirable])

  const onDragEnd = useCallback((event) => {
    release()

    if (!event.over || event.over.id === event.active.id) {
      return
    }

    onChange(drop(value, event.active.id, event.over.id, zoneOf(event, rankable), `rank-${++fresh.current}`).filter(v => v.value))
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
    <dropContext.Provider value={context as any}>
      <DndContext
        sensors={sensors}
        collisionDetection={collide}
        onDragStart={(event) => { dragging.current = true; setActive(event.active.id); setDragged(event.active.data.current) }}
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
        {createPortal(<DragOverlay dropAnimation={null}>
          {dragged && (
            <div
              sx={{
                display: 'inline-flex',
                paddingX: '6px',
                paddingY: '3px',
                backgroundColor: colors(theme)[dragged.group] || 'transparent',
                border: '1px solid',
                borderColor: colors(theme)[dragged.group] || '#FFF',
                borderRadius: '2px',
                color: '#FFF',
                fontFamily: 'monospace',
                fontSize: '0.75em',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                cursor: 'grabbing',
              }}
            >
              {dragged.label}
            </div>
          )}
        </DragOverlay>, document.body)}
      </DndContext>
    </dropContext.Provider>
  )
}
