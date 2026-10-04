import { forwardRef, useCallback, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button, Option } from '@sensorr/ui'
import { emojize, useTitle } from '@sensorr/utils'
import Body from '../../layout/Body/Body'
import { useConfigContext } from '../../contexts/Config/Config'
import { BUILTINS, LOCKED, HomeKey, List, Row, fits, listRowId, listsOf, rowsOf } from '../Home/rows'
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
  const addable = useMemo(() => [...Object.keys(BUILTINS), ...lists.map(listRowId)]
    .filter((id) => fits(home, id, lists) && !rows.some((row) => row.id === id)), [home, rows, lists])

  const setRows = (next: Row[]) => setHomes((homes) => ({ ...homes, [home]: next }))
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))

  return (
    <Body>
      <section>
        <article>
          <h2 id='home-home'>Home</h2>
          <p>
            The rows of each Home, in order. Drag a row to move it, uncheck it to hide it. The <strong>Browser</strong> Home is the one of a browser, <strong>Movies</strong> and <strong>TV</strong> the ones of the installed app.
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
              {addable.map((id) => <option key={id} value={id}>{labelOf(id).label}</option>)}
            </select>
            <button type='submit' title='Add the row' disabled={!adding} sx={Home.styles.plus}>+</button>
          </form>
          <form
            sx={{ display: 'flex', flexDirection: 'column' }}
            onSubmit={(e) => {
              e.preventDefault()
              onSave({ home: homes })
            }}
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={({ active, over }) => {
                if (over && active.id !== over.id) {
                  setRows(arrayMove(rows, rows.findIndex(({ id }) => id === active.id), rows.findIndex(({ id }) => id === over.id)))
                }
              }}
            >
              <SortableContext items={rows.map(({ id }) => id)} strategy={verticalListSortingStrategy}>
                <ol sx={Home.styles.rows}>
                  {rows.map((row) => (
                    <SortableRow
                      key={row.id}
                      row={row}
                      {...labelOf(row.id)}
                      locked={LOCKED[home].includes(row.id)}
                      onToggle={() => setRows(rows.map((other) => other.id === row.id ? { ...other, hidden: !other.hidden } : other))}
                    />
                  ))}
                </ol>
              </SortableContext>
            </DndContext>
            <div sx={{ display: 'flex', marginTop: 4 }}>
              <Button type='submit' color='primary' sx={{ flex: 1 }}>Save</Button>
            </div>
          </form>
        </article>
      </section>
    </Body>
  )
}

const RowSettings = forwardRef<HTMLLIElement, any>(({ row, label, title, kind, locked, onToggle, handle, ...props }, ref) => (
  <li ref={ref} {...props} sx={Home.styles.row} data-hidden={row.hidden || undefined}>
    <span {...handle} sx={Home.styles.handle} aria-label={`Move ${label}`}>⁝</span>
    <span sx={Home.styles.label}>
      <span>{label}</span>
      {title && <small>{title}</small>}
    </span>
    <span sx={Home.styles.kind}>{kind}</span>
    {locked ? (
      <span sx={Home.styles.toggle} title='Opens a screen the app reaches only from this Home' aria-label='Always shown'>🔒</span>
    ) : (
      <span sx={Home.styles.toggle}>
        <Option id={`row-${row.id}`} type='checkbox' checked={!row.hidden} onChange={onToggle} title={row.hidden ? 'Show the row' : 'Hide the row'} aria-label={`Show ${label}`} />
      </span>
    )}
  </li>
))

const SortableRow = (props) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.row.id })

  return (
    <RowSettings
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : undefined }}
      handle={{ ...attributes, ...listeners }}
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
    alignItems: 'stretch',
    minHeight: '3em',
    border: '1px solid',
    borderColor: 'grayDark',
    borderRadius: '0.25rem',
    backgroundColor: 'whiteDark',
    '&[data-hidden]': {
      '>span:not(:first-of-type)': {
        opacity: 0.45,
      },
    },
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
