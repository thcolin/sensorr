import { forwardRef, useCallback, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'
import { nanoid } from 'nanoid'
import { DndContext, DragOverlay, PointerSensor, closestCenter, pointerWithin, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core'
import { Button, Option } from '@sensorr/ui'
import { emojize, useTitle } from '@sensorr/utils'
import Body from '../../layout/Body/Body'
import { useConfigContext } from '../../contexts/Config/Config'
import { BUILTINS, GROUPABLE, LOCKED, HomeKey, List, Row, dropRow, fits, isGroup, listRowId, listsOf, rowsOf } from '../Home/rows'
import { Capsule } from './Capsule'

const HOMES: { [home in HomeKey]: { emoji: string, label: string } } = {
  all: { emoji: '🖥️', label: 'Browser' },
  movie: { emoji: '🍿', label: 'Movies' },
  tv: { emoji: '📺', label: 'TV' },
}

export const useRowLabel = (lists: List[]) => {
  const { t } = useTranslation()

  return useCallback((id: string) => {
    if (id.startsWith('list:')) {
      const list = lists.find((list) => listRowId(list) === id)
      return { label: emojize('🗂️', list?.name), title: `${list?.sources.length} source${list?.sources.length === 1 ? '' : 's'}`, kind: 'list' }
    }

    return { label: t(`items.${BUILTINS[id].item}.label`).replace(/<\/?small>/g, ''), title: t(`items.${BUILTINS[id].item}.title`), kind: 'built-in' }
  }, [lists, t])
}

// On the middle of a row a dragged row makes a group with it, on an edge it goes before or after it,
// as a ⭐ prefer tag does on another in Policies
const zoneOf = ({ active, over, activatorEvent, delta }) => {
  const y = (activatorEvent.touches?.[0] ?? activatorEvent).clientY + delta.y
  const ratio = (y - over.rect.top) / over.rect.height
  const grouping = !String(active.id).startsWith('group:') && GROUPABLE(String(active.id)) && GROUPABLE(String(over.id))

  return (grouping && ratio > 0.3 && ratio < 0.7) ? 'group' : ratio < 0.5 ? 'before' : 'after'
}

// A pointer over a group and one of its tabs drops on the tab, the innermost
const collide = (args) => {
  const within = pointerWithin(args)
  return within.length ? [...within].sort((a, b) => (args.droppableRects.get(a.id)?.height || 0) - (args.droppableRects.get(b.id)?.height || 0)) : closestCenter(args)
}

const Home = ({ ...props }) => {
  useTitle('Settings - Home')
  const { onSave } = useOutletContext() as any
  const { config } = useConfigContext()
  const lists = listsOf(config)
  const [home, setHome] = useState<HomeKey>('all')
  const [homes, setHomes] = useState<{ [home in HomeKey]: Row[] }>(() => ({
    all: rowsOf('all', config.get('home.all'), lists),
    movie: rowsOf('movie', config.get('home.movie'), lists),
    tv: rowsOf('tv', config.get('home.tv'), lists),
  }))
  const [adding, setAdding] = useState('')
  const labelOf = useRowLabel(lists)

  const rows = homes[home]
  const dirty = (Object.keys(HOMES) as HomeKey[]).some((key) => JSON.stringify(homes[key]) !== JSON.stringify(rowsOf(key, config.get(`home.${key}`), lists)))
  const addable = useMemo(() => [...Object.keys(BUILTINS), ...lists.map(listRowId)]
    .filter((id) => fits(home, id, lists) && !rows.some((row) => row.id === id || row.tabs?.includes(id))), [home, rows, lists])

  const setRows = (next: Row[]) => setHomes((homes) => ({ ...homes, [home]: next }))
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))
  const [dragged, setDragged] = useState(null)
  const [target, setTarget] = useState(null)
  const locked = (id: string) => LOCKED[home].includes(id)
  const toggle = (id: string) => setRows(rows.map((other) => other.id === id ? { ...other, hidden: !other.hidden } : other))
  // ↑ and ↓ on a handle move its row among its neighbours, the rows of the Home or the tabs of its group
  const move = (id: string, step: -1 | 1) => {
    const group = rows.find((row) => isGroup(row) && row.tabs.includes(id))
    const siblings = group ? group.tabs : rows.map((row) => row.id)
    const other = siblings[siblings.indexOf(id) + step]

    if (other) {
      setRows(dropRow(rows, id, other, step < 0 ? 'before' : 'after', `group:${nanoid(8)}`))
    }
  }

  return (
    <Body>
      <section>
        <article>
          <h2 id='home-home'>Home</h2>
          <p>
            The rows of each Home, in order. Drag a row to move it, drop it on the middle of another to show both as the tabs of one row, uncheck it to hide it. The <strong>Browser</strong> Home is the one of a browser, <strong>Movies</strong> and <strong>TV</strong> the ones of the installed app.
            {' '}A <code>🔒</code> row opens a screen the app reaches only from its Home: it moves, it stays shown.
          </p>
          <Capsule
            name='home'
            labelledBy='home-home'
            value={home}
            onChange={(value) => {
              setHome(value as HomeKey)
              setAdding('')
            }}
            options={Object.entries(HOMES).map(([value, { emoji, label }]) => ({ value, label: emojize(emoji, label) }))}
          />
          <form
            sx={Home.styles.add}
            onSubmit={(e) => {
              e.preventDefault()

              if (adding) {
                setRows([...rows, { id: adding, hidden: false }])
                setAdding('')
              }
            }}
          >
            <select
              aria-label='Row to add'
              value={adding}
              onChange={(e) => setAdding(e.target.value)}
              disabled={!addable.length}
              sx={{ variant: 'select.default', flex: 1 }}
            >
              <option value=''>{addable.length ? 'Add a row…' : 'Every row is on this Home'}</option>
              {addable.map((id) => <option key={id} value={id}>{[labelOf(id).label, labelOf(id).title].filter(Boolean).join(' · ')}</option>)}
            </select>
            <button type='submit' title='Add the row' disabled={!adding} sx={Home.styles.plus}>+</button>
          </form>
          <form
            sx={{ display: 'flex', flexDirection: 'column' }}
            onSubmit={(e) => {
              e.preventDefault()
              // The config reloads in place: a new state redraws Save as saved
              onSave({ home: homes }).then(() => setHomes((homes) => ({ ...homes })), () => null)
            }}
          >
            <DndContext
              sensors={sensors}
              collisionDetection={collide}
              onDragStart={({ active }) => setDragged(active.id)}
              onDragMove={(event) => setTarget(event.over && event.over.id !== event.active.id ? { id: event.over.id, zone: zoneOf(event) } : null)}
              onDragCancel={() => {
                setDragged(null)
                setTarget(null)
              }}
              onDragEnd={({ active, over }) => {
                if (over && target && active.id !== over.id) {
                  setRows(dropRow(rows, String(active.id), String(over.id), target.zone, `group:${nanoid(8)}`))
                }

                setDragged(null)
                setTarget(null)
              }}
            >
              <ol sx={Home.styles.rows}>
                {rows.map((row) => isGroup(row) ? (
                  <DraggableRow
                    key={row.id}
                    row={row}
                    target={target}
                    label={emojize('🗂️', 'Group')}
                    title={row.tabs.map((id) => labelOf(id).label).join(' · ')}
                    kind='tabs'
                    locked={row.tabs.some(locked)}
                    onToggle={() => toggle(row.id)}
                    onMove={(step) => move(row.id, step)}
                  >
                    <ol sx={Home.styles.tabs}>
                      {row.tabs.map((id) => (
                        <DraggableRow
                          key={id}
                          row={{ id, hidden: false }}
                          target={target}
                          {...labelOf(id)}
                          locked={locked(id)}
                          onUngroup={() => setRows(dropRow(rows, id, row.id, 'after', `group:${nanoid(8)}`))}
                          onMove={(step) => move(id, step)}
                        />
                      ))}
                    </ol>
                  </DraggableRow>
                ) : (
                  <DraggableRow
                    key={row.id}
                    row={row}
                    target={target}
                    {...labelOf(row.id)}
                    locked={locked(row.id)}
                    onToggle={() => toggle(row.id)}
                    onMove={(step) => move(row.id, step)}
                  />
                ))}
              </ol>
              {createPortal((
                <DragOverlay dropAnimation={null}>
                  {dragged && <div sx={Home.styles.overlay}>{String(dragged).startsWith('group:') ? emojize('🗂️', 'Group') : labelOf(String(dragged)).label}</div>}
                </DragOverlay>
              ), document.body)}
            </DndContext>
            <div sx={{ display: 'flex', marginTop: 4 }}>
              <Button type='submit' color='primary' disabled={!dirty} title={dirty ? undefined : 'Nothing to save'} sx={{ flex: 1 }}>Save</Button>
            </div>
          </form>
        </article>
      </section>
    </Body>
  )
}

const RowSettings = forwardRef<HTMLLIElement, any>(({ row, label, title, kind, locked, onToggle = null, onUngroup = null, onMove, handle, zone, children, ...props }, ref) => (
  <li ref={ref} {...props} sx={Home.styles.row} data-hidden={row.hidden || undefined} data-zone={zone || undefined} data-group={!!children || undefined}>
    <div>
      <span
        {...handle}
        onKeyDown={(e) => {
          if (['ArrowUp', 'ArrowDown'].includes(e.key)) {
            e.preventDefault()
            onMove(e.key === 'ArrowUp' ? -1 : 1)
          }
        }}
        sx={Home.styles.handle}
        aria-label={`Move ${label}, with the up and down arrows`}
      >
        ⁝
      </span>
      <span sx={Home.styles.label}>
        <span>{label}</span>
        {title && <small>{title}</small>}
      </span>
      {kind && <span sx={Home.styles.kind}>{kind}</span>}
      {onUngroup ? (
        <button type='button' onClick={onUngroup} title='Take it out of the group' sx={Home.styles.ungroup}>✕</button>
      ) : locked ? (
        <span sx={Home.styles.toggle} title='Opens a screen the app reaches only from this Home' aria-label='Always shown'>🔒</span>
      ) : (
        <span sx={Home.styles.toggle}>
          <Option id={`row-${row.id}`} type='checkbox' checked={!row.hidden} onChange={onToggle} title={row.hidden ? 'Show the row' : 'Hide the row'} aria-label={`Show ${label}`} />
        </span>
      )}
    </div>
    {children}
  </li>
))

const DraggableRow = ({ target, ...props }) => {
  const draggable = useDraggable({ id: props.row.id })
  const droppable = useDroppable({ id: props.row.id })

  return (
    <RowSettings
      ref={(node) => {
        draggable.setNodeRef(node)
        droppable.setNodeRef(node)
      }}
      style={{ opacity: draggable.isDragging ? 0.4 : undefined }}
      handle={{ ...draggable.attributes, ...draggable.listeners }}
      zone={target?.id === props.row.id ? target.zone : null}
      {...props}
    />
  )
}

Home.styles = {
  add: {
    display: 'flex',
    alignItems: 'stretch',
    marginTop: 4,
    '>select': {
      borderTopRightRadius: '0rem',
      borderBottomRightRadius: '0rem',
    },
  },
  plus: {
    variant: 'button.reset',
    paddingX: 6,
    backgroundColor: 'accent',
    color: 'whitePure',
    borderTopRightRadius: '0.25rem',
    borderBottomRightRadius: '0.25rem',
    '&:hover:not(:disabled)': {
      backgroundColor: 'accentDarker',
    },
    '&:active:not(:disabled)': {
      backgroundColor: 'accentDarkest',
    },
    '&:disabled': {
      opacity: 0.45,
      cursor: 'default',
    },
  },
  rows: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    listStyle: 'none',
    padding: 12,
    marginY: 4,
  },
  row: {
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid',
    borderColor: 'grayDark',
    borderRadius: '0.25rem',
    backgroundColor: 'whiteDark',
    '>div': {
      display: 'flex',
      alignItems: 'stretch',
      minHeight: '3em',
    },
    '&[data-hidden] >div': {
      '>span:not(:first-of-type)': {
        opacity: 0.45,
      },
    },
    '&[data-zone="group"]': {
      outline: '2px dashed',
      outlineColor: 'primary',
      outlineOffset: '2px',
    },
    '&[data-zone="before"]': {
      boxShadow: (theme) => `0 -5px 0 -3px ${theme.rawColors.primary}`,
    },
    '&[data-zone="after"]': {
      boxShadow: (theme) => `0 5px 0 -3px ${theme.rawColors.primary}`,
    },
  },
  tabs: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    listStyle: 'none',
    padding: 8,
    margin: 12,
    borderTop: '1px solid',
    borderColor: 'grayDark',
  },
  ungroup: {
    variant: 'button.reset',
    minWidth: '3em',
    borderLeft: '1px solid',
    borderColor: 'grayDark',
    color: 'error',
  },
  overlay: {
    display: 'inline-flex',
    paddingX: 6,
    paddingY: 8,
    border: '1px solid',
    borderColor: 'primary',
    borderRadius: '0.25rem',
    backgroundColor: 'whiteDark',
    fontWeight: 'semibold',
    whiteSpace: 'nowrap',
    cursor: 'grabbing',
  },
  handle: {
    display: 'flex',
    alignItems: 'center',
    paddingX: 8,
    borderRight: '1px solid',
    borderColor: 'grayDark',
    fontFamily: 'monospace',
    cursor: 'grab',
    touchAction: 'none',
    ':focus-visible': {
      outline: '2px solid',
      outlineColor: 'primary',
      outlineOffset: '-2px',
    },
  },
  label: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    paddingX: 6,
    paddingY: 8,
    '>span, >small': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    '>span': {
      fontWeight: 'semibold',
    },
    '>small': {
      fontSize: 6,
      color: 'grayDarkest',
    },
  },
  kind: {
    display: ['none', 'flex'],
    alignItems: 'center',
    paddingX: 6,
    borderLeft: '1px solid',
    borderColor: 'grayDark',
    fontFamily: 'monospace',
    fontSize: 6,
    color: 'grayDarkest',
    whiteSpace: 'nowrap',
    minWidth: '6.5em',
    justifyContent: 'center',
  },
  toggle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '3em',
    borderLeft: '1px solid',
    borderColor: 'grayDark',
  },
}

export default Home
