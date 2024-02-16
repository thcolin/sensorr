import React, { useState, useCallback, createContext, useContext, useEffect } from 'react'
import { useInput, Box, Text, useApp } from 'ink'
import Spinner from 'ink-spinner'
import EventEmitter from 'events'

export class StdinMock extends EventEmitter {
  isTTY = true

  ref = () => {}
  unref = () => {}
  write = () => {}
  setEncoding() {}
  setRawMode() {}
  resume() {}
  pause() {}
}

export const TasksContext = createContext({})

export const Tasks = ({ state: initialState = {}, handlers, ...props }) => {
  const { exit } = useApp()
  const [tasks, setTasks] = useState({})
  const [state, setState] = useState(initialState)
  const [error, setError] = useState(null)

  const handleError = useCallback((error) => {
    setError(error)
    handlers.error(error)
  }, [])

  useEffect(() => {
    if (Object.keys(tasks).length && Object.values(tasks).every((task) => ['done', 'warning', 'error'].includes(task))) {
      handlers.success()
      exit()
    }
  }, [tasks, exit])

  useInput((input, key) => {
    if (input === 'c' && key.ctrl) {
      handlers.success()
      exit()
    }
  })

  return !error && (
    <TasksContext.Provider {...props} value={{ state, setState, tasks, setTasks, handleError }} />
  )
}

export const Task = ({ status = 'waiting', title = null, error = null, output = null, depth = 0, ...props }) => (
  <Box paddingLeft={1 + (depth * 2)} flexDirection='column'>
    <Text>
      <Status value={status} /> <Text color='white'>{title}</Text>
    </Text>
    {!!(error || output) && (
      <Text color='grey'> → {(error || output)}</Text>
    )}
  </Box>
)

export const useTask = ({ id, ...raw }, options = {}) => {
  const context = useContext(TasksContext)
  const [task, setTask] = useState({ id, output: '', ...raw, options })

  const setStatus = useCallback((value) => context.setTasks(
    (tasks) => ({ ...tasks, [id]: typeof value === 'function' ? value((tasks)[id] || 'waiting') : value })
  ), [])

  useEffect(() => {
    context.setTasks((tasks) => ({ ...tasks, [id]: 'waiting' }))
  }, [])

  return {
    task,
    setTask,
    status: context.tasks[id] || 'waiting',
    setStatus,
    context,
    ready: !options?.dependencies?.length || (options?.dependencies || []).every(id => ['done', 'warning', 'error'].includes(context.tasks[id])),
  }
}

const Status = ({ value = 'waiting', ...props }) => {
  switch (value) {
    case 'loading':
      return <Text color='yellow'><Spinner /></Text>
    case 'done':
      return <Text color='green'>✔</Text>
    case 'error':
      return <Text color='red'>✖</Text>
    case 'warning':
      return <Text color='yellow'>⚠</Text>
    default:
      return <Text color='yellow'>❯</Text>
  }
}
