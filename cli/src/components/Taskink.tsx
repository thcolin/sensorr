import React, { useState, useCallback, createContext, useContext, useEffect } from 'react'
import { Box, Text, useApp } from 'ink'
import Spinner from 'ink-spinner'

export const TasksContext = createContext({})

export const Tasks = ({ logger, job, head = null, autoquit = true, ...props }: { logger: any, job: string, head?: any, autoquit?: boolean, children: any }) => {
  const { exit } = useApp()
  const [tasks, setTasks] = useState({})
  const [state, setState] = useState({})
  const quit = useCallback(() => {
    setTimeout(() => {
      exit()
      console.log('\n')
    }, 200)
  }, [exit])

  useEffect(() => {
    if (autoquit && Object.keys(tasks).length && Object.values(tasks).every((task: any) => ['done', 'warning', 'error'].includes(task))) {
      quit()
    }
  }, [tasks, quit])

  const registerTask = useCallback((id: string, status: any) => {
    if (!(tasks as any)[id]) {
      setTasks(tasks => ({ ...tasks, [id]: status }))
    }

    return [
      (tasks as any)[id] || status,
      (value: any) => setTasks(tasks => ({ ...tasks, [id]: typeof value === 'function' ? value((tasks as any)[id] || status) : value })),
    ]
  }, [tasks, setTasks])

  return (
    <>
      {head}
      <TasksContext.Provider {...props} value={{ state, setState, tasks, registerTask, logger, job, quit }} />
    </>
  )
}

export const Task = ({ status = 'waiting', title = null, output = null, depth = 0, ...props }: { status: 'loading' | 'done' | 'error' | 'warning' | string, title: any, output?: any, depth?: number }) => (
  <Box paddingLeft={1 + (depth * 2)} flexDirection='column'>
    <Text>
      <Status value={status} /> <Text color='white'>{title}</Text>
    </Text>
    {!!output && (
      <Text color='grey'> → {output}</Text>
    )}
  </Box>
)

export const useTask = ({ id, status: defaultStatus = 'waiting', ...raw }: { id: string, title: any, status?: string, output?: any }, options: { dependencies?: string[], [key:string]: any } = {}) => {
  const context = useContext(TasksContext) as any
  const [task, setTask] = useState({ id, output: '', ...raw, options })
  const [status, setStatus] = context.registerTask(id, defaultStatus)

  return {
    task,
    setTask,
    status,
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
