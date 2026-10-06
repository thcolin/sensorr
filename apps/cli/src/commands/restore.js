import React, { useEffect } from 'react'
import path from 'path'
import readline from 'readline'
import mongoose from 'mongoose'
import unzipper from 'unzipper'
import { render, Text } from 'ink'
import { DUMP_COLLECTIONS, dumpManifestError, restoreConfig } from '@sensorr/sensorr'
import { Tasks, Task, useTask, StdinMock } from '../components/Taskink'
import api from '../store/api'
import command from '../utils/command'

const { EJSON } = mongoose.mongo.BSON

const BATCH = 1000

const meta = {
  command: 'restore <archive>',
  desc: '📦 Replace the library and the settings with a dump, the secrets of this Sensorr stay',
  builder: {},
}

export default (job, handlers) => ({
  ...meta,
  handler: command(job, { ...meta, command: 'restore' }, async ({ argv, config, logger }) => {
    const { waitUntilExit } = render((
      <Tasks handlers={handlers} state={{ metadata: { job, command: 'restore' }, logger, config }}>
        <RestoreTask archive={path.resolve(argv.archive)} />
      </Tasks>
    ), { exitOnCtrlC: false, stdin: process.stdin.isTTY ? process.stdin : new StdinMock })

    await waitUntilExit()
  }),
})

const readManifest = async (directory) => {
  const entry = directory.files.find(({ path }) => path === 'manifest.json')

  if (!entry) {
    throw new Error('Not a Sensorr dump, the archive has no manifest.json')
  }

  const manifest = JSON.parse((await entry.buffer()).toString())
  const error = dumpManifestError(manifest)

  if (error) {
    throw new Error(error)
  }

  return manifest
}

const documentsOf = async function* (entry) {
  for await (const line of readline.createInterface({ input: entry.stream(), crlfDelay: Infinity })) {
    if (line.trim()) {
      yield EJSON.parse(line, { relaxed: true })
    }
  }
}

// One transaction: a dump that breaks halfway leaves the library as it was
const restore = async ({ directory, manifest, onCollection }) => {
  const connection = await mongoose.connection.asPromise()
  const session = connection.getClient().startSession()
  const counts = {}

  try {
    await session.withTransaction(async () => {
      for (const name of DUMP_COLLECTIONS) {
        const entry = directory.files.find(({ path }) => path === `${name}.jsonl`)
        const collection = connection.db.collection(name)
        let batch = []
        counts[name] = 0

        await collection.deleteMany({}, { session })

        for await (const doc of entry ? documentsOf(entry) : []) {
          batch.push(doc)

          if (batch.length === BATCH) {
            await collection.insertMany(batch, { session, ordered: true })
            counts[name] += batch.length
            batch = []
          }
        }

        if (batch.length) {
          await collection.insertMany(batch, { session, ordered: true })
          counts[name] += batch.length
        }

        if (counts[name] !== (manifest.counts[name] || 0)) {
          throw new Error(`${name}.jsonl holds ${counts[name]} documents, its manifest.json says ${manifest.counts[name] || 0}`)
        }

        onCollection(name, counts[name])
      }
    })
  } finally {
    await session.endSession()
  }

  return counts
}

const RestoreTask = ({ archive }) => {
  const { task, setTask, status, setStatus, context: { state, handleError } } = useTask({
    id: 'restore',
    title: '📦 Restore the library and the settings...',
  })

  useEffect(() => {
    const cb = async () => {
      setStatus('loading')

      try {
        const directory = await unzipper.Open.file(archive)
        const manifest = await readManifest(directory)
        setTask((task) => ({ ...task, output: <Text>Dump of <Text bold={true}>{manifest.date}</Text>, Sensorr {manifest.version}...</Text> }))

        const counts = await restore({
          directory,
          manifest,
          onCollection: (name, count) => setTask((task) => ({ ...task, output: <Text><Text bold={true}>{count}</Text> {name} written...</Text> })),
        })

        const entry = directory.files.find(({ path }) => path === 'config.json')

        if (entry) {
          const dumped = JSON.parse((await entry.buffer()).toString())
          const { uri, params, init } = api.query.config.postConfig({ body: restoreConfig(state.config.getProperties(), dumped) })
          await api.fetch(uri, params, init)
        }

        const summary = DUMP_COLLECTIONS.map((name) => `${counts[name]} ${name}`).join(', ')
        setTask((task) => ({ ...task, output: <Text>{summary}{entry ? ', and the settings' : ''}, restored</Text> }))
        state.logger.info({ message: `📦 Dump of ${manifest.date} restored: ${summary}${entry ? ', and the settings' : ''}`, metadata: { ...state.metadata, manifest, summary: { restore: counts } } })
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
