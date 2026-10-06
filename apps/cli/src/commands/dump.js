import React, { useEffect } from 'react'
import path from 'path'
import fs from 'fs'
import { Readable } from 'stream'
import { finished } from 'stream/promises'
import mongoose from 'mongoose'
import yazl from 'yazl'
import { render, Text } from 'ink'
import { DUMP_COLLECTIONS, DUMP_FILE, DUMP_FOLDER, DUMP_FORMAT, DUMP_KEPT, dumpFileOf, stripConfig, stripDocument } from '@sensorr/sensorr'
import { Tasks, Task, useTask, StdinMock } from '../components/Taskink'
import command from '../utils/command'
// The app version lives in the workspace package.json, outside any project
// eslint-disable-next-line @nx/enforce-module-boundaries
import app from '../../../../package.json'

const { EJSON } = mongoose.mongo.BSON

const meta = {
  command: 'dump',
  desc: '💾 Dump the library and the settings, without any secret, into a .zip',
  builder: {},
}

export default (job, handlers) => ({
  ...meta,
  handler: command(job, meta, async ({ config, logger }) => {
    const { waitUntilExit } = render((
      <Tasks handlers={handlers} state={{ metadata: { job, command: meta.command }, logger, config }}>
        <DumpTask />
      </Tasks>
    ), { exitOnCtrlC: false, stdin: process.stdin.isTTY ? process.stdin : new StdinMock })

    await waitUntilExit()
  }),
})

// Every collection is read at the same point in time, so a cron writing meanwhile cannot split a show from its episodes
const dump = async ({ config, folder, onCollection }) => {
  const connection = await mongoose.connection.asPromise()
  const session = connection.getClient().startSession({ snapshot: true })
  const date = new Date()
  const file = path.join(folder, dumpFileOf(date))
  const part = `${file}.part`
  let output

  try {
    const counts = {}

    for (const name of DUMP_COLLECTIONS) {
      counts[name] = await connection.db.collection(name).countDocuments({}, { session })
    }

    const zip = new yazl.ZipFile()
    zip.addBuffer(Buffer.from(JSON.stringify({ format: DUMP_FORMAT, version: app.version, date: date.toISOString(), counts }, null, 2)), 'manifest.json')
    zip.addBuffer(Buffer.from(JSON.stringify(stripConfig(config.getProperties()), null, 2)), 'config.json')

    // yazl listens to no stream it reads: a cursor that fails would throw outside of this function
    let fail
    const failure = new Promise((resolve, reject) => (fail = reject))
    zip.outputStream.on('error', fail)

    for (const name of DUMP_COLLECTIONS) {
      const cursor = connection.db.collection(name).find({}, { session })
      zip.addReadStream(Readable.from((async function* () {
        for await (const doc of cursor) {
          yield `${EJSON.stringify(stripDocument(doc), { relaxed: true })}\n`
        }

        onCollection(name, counts[name])
      })()).on('error', fail), `${name}.jsonl`)
    }

    fs.mkdirSync(folder, { recursive: true })
    output = fs.createWriteStream(part, { mode: 0o600 })
    zip.outputStream.pipe(output)
    zip.end()
    await Promise.race([finished(output), failure])
    fs.renameSync(part, file)

    return { file, counts, size: fs.statSync(file).size }
  } catch (error) {
    output?.destroy()
    fs.rmSync(part, { force: true })
    throw error
  } finally {
    await session.endSession()
  }
}

// Only once the new dump is written: a failed one never costs an older one
const rotate = (folder) => fs.readdirSync(folder)
  .filter((name) => DUMP_FILE.test(name))
  .sort()
  .slice(0, -DUMP_KEPT)
  .map((name) => (fs.rmSync(path.join(folder, name)), name))

const DumpTask = () => {
  const { task, setTask, status, setStatus, context: { state, handleError } } = useTask({
    id: 'dump',
    title: '💾 Dump the library and the settings...',
  })

  useEffect(() => {
    const cb = async () => {
      setStatus('loading')
      const folder = path.resolve(DUMP_FOLDER)

      try {
        const { file, counts, size } = await dump({
          config: state.config,
          folder,
          onCollection: (name, count) => setTask((task) => ({ ...task, output: <Text><Text bold={true}>{count}</Text> {name} written...</Text> })),
        })
        const removed = rotate(folder)
        const mb = (size / 1024 / 1024).toFixed(1)
        setTask((task) => ({ ...task, output: <Text><Text bold={true}>{path.basename(file)}</Text>, {mb} MB{removed.length ? `, ${removed.join(', ')} removed` : ''}</Text> }))
        state.logger.info({ message: `💾 ${path.basename(file)} written, ${mb} MB (${DUMP_COLLECTIONS.map((name) => `${counts[name]} ${name}`).join(', ')})`, metadata: { ...state.metadata, file: path.basename(file), size, removed, summary: { dump: counts } } })
        setStatus('done')
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
