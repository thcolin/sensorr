import React from 'react'
import { render } from 'ink'
import { Sensorr, Znab } from '@sensorr/sensorr'
import { Tasks, StdinMock } from '../components/Taskink'
import { FetchAPIShowsTask, ProcessShowsTask } from '../components/Tasks/ProcessShowsTask'
import command from '../utils/command'

const meta = {
  command: 'record',
  type: 'show',
  desc: '📹 Record wished shows episodes with best releases available',
  builder: {},
}

export default (job, handlers) => ({
  ...meta,
  handler: command(job, meta, async ({ config, logger }) => {
    const sensorr = new Sensorr({ region: config.get('region') })
    // One Znab per indexer for the whole run, so its capabilities are asked once
    const znabs = config.get('znabs').filter((znab) => !znab.disabled).map((znab) => new Znab(znab, {}))

    const { waitUntilExit } = render((
      <Tasks handlers={handlers} state={{ metadata: { job, command: meta.command, type: meta.type }, logger, sensorr, znabs, policies: config.get('policies') }}>
        <FetchAPIShowsTask />
        <ProcessShowsTask command={meta.command} proposalOnly={config.get('jobs.record.shows.proposalOnly')} />
      </Tasks>
    ), { exitOnCtrlC: false, stdin: process.stdin.isTTY ? process.stdin : new StdinMock })

    await waitUntilExit()
  }),
})
