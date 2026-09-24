import React from 'react'
import { render } from 'ink'
import { Sensorr, Znab } from '@sensorr/sensorr'
import { Tasks, StdinMock } from '../components/Taskink'
import { FetchAPIShowsTask, ProcessShowsTask } from '../components/Tasks/ProcessShowsTask'
import command from '../utils/command'

const WINDOW = 7 * 24 * 60 * 60 * 1000

const meta = {
  command: 'airing',
  desc: '📡 Record wished episodes aired in the last 7 days',
  builder: {},
}

export default (job, handlers) => ({
  ...meta,
  handler: command(job, meta, async ({ config, logger }) => {
    const sensorr = new Sensorr({ region: config.get('region') })
    // One Znab per indexer for the whole run, so its capabilities are asked once
    const znabs = config.get('znabs').filter((znab) => !znab.disabled).map((znab) => new Znab(znab, {}))
    const since = Date.now() - WINDOW

    const { waitUntilExit } = render((
      <Tasks handlers={handlers} state={{ metadata: { job, command: meta.command }, logger, sensorr, znabs, policies: config.get('policies') }}>
        <FetchAPIShowsTask since={since} />
        <ProcessShowsTask command={meta.command} since={since} proposalOnly={config.get('jobs.airing.proposalOnly')} />
      </Tasks>
    ), { exitOnCtrlC: false, stdin: process.stdin.isTTY ? process.stdin : new StdinMock })

    await waitUntilExit()
  }),
})
