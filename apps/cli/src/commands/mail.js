import React, { useEffect } from 'react'
import { render, Text } from 'ink'
import { Task, Tasks, useTask, StdinMock } from '../components/Taskink'
import api from '../store/api'
import command from '../utils/command'

const meta = {
  command: 'mail',
  desc: '📬 Mail each friend their requests that reached Plex since their last mail',
  builder: {},
}

export default (job, handlers) => ({
  ...meta,
  handler: command(job, meta, async ({ logger }) => {
    const { waitUntilExit } = render((
      <Tasks handlers={handlers} state={{ metadata: { job, command: meta.command }, logger }}>
        <MailRequestsTask />
      </Tasks>
    ), { exitOnCtrlC: false, stdin: process.stdin.isTTY ? process.stdin : new StdinMock })

    await waitUntilExit()
  }),
})

const MailRequestsTask = () => {
  const { task, setTask, status, setStatus, context: { state, handleError } } = useTask({
    id: 'mail-requests',
    title: '📬 Mail the requests ready to watch...',
  })

  useEffect(() => {
    const cb = async () => {
      setStatus('loading')

      try {
        const { uri, params, init } = api.query.mail.postRequests({ body: {} })
        const { mailed, friends } = await api.fetch(uri, params, init)
        setTask((task) => ({ ...task, output: <Text><Text bold={true}>{mailed}</Text> of {friends} friends mailed</Text> }))
        setStatus('done')
        state.logger.info({ message: `📬 ${mailed} of ${friends} friends mailed their requests ready to watch`, metadata: { ...state.metadata, summary: { mailed } } })
      } catch (error) {
        setStatus('error')
        setTask((task) => ({ ...task, error: error.message || error }))
        handleError(error)
      }
    }

    cb()
  }, [])

  return (
    <Task {...task} status={status} />
  )
}
