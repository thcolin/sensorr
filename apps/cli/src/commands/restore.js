import React, { useEffect } from 'react'
import path from 'path'
import readline from 'readline'
import mongoose from 'mongoose'
import unzipper from 'unzipper'
import { render, Text } from 'ink'
import { DUMP_COLLECTIONS, DUMP_ENTRY_MAX, dumpManifestError, restoreConfig } from '@sensorr/sensorr'
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

  if (entry.uncompressedSize > DUMP_ENTRY_MAX) {
    throw new Error('Not a Sensorr dump, its manifest.json is too large')
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

const stagingOf = (name) => `${name}_restore`

// Each collection is filled and counted aside first, then takes the place of the current one: a dump that breaks
// before the swap leaves the library as it was. One transaction for the whole dump does not fit a 1 GB cache.
const restore = async ({ directory, manifest, onCollection }) => {
  const { db } = await mongoose.connection.asPromise()
  const counts = {}

  try {
    for (const name of DUMP_COLLECTIONS) {
      const entry = directory.files.find(({ path }) => path === `${name}.jsonl`)
      const indexes = (await db.collection(name).indexes().catch(() => [])).filter((index) => index.name !== '_id_')
      await db.collection(stagingOf(name)).drop().catch(() => null)
      const staging = await db.createCollection(stagingOf(name))
      let batch = []
      counts[name] = 0

      if (indexes.length) {
        await staging.createIndexes(indexes.map(({ v, ns, ...index }) => index))
      }

      for await (const doc of entry ? documentsOf(entry) : []) {
        batch.push(doc)

        if (batch.length === BATCH) {
          await staging.insertMany(batch, { ordered: true })
          counts[name] += batch.length
          batch = []
        }
      }

      if (batch.length) {
        await staging.insertMany(batch, { ordered: true })
        counts[name] += batch.length
      }

      if (counts[name] !== (manifest.counts[name] || 0)) {
        throw new Error(`${name}.jsonl holds ${counts[name]} documents, its manifest.json says ${manifest.counts[name] || 0}`)
      }
    }

    for (const name of DUMP_COLLECTIONS) {
      await db.renameCollection(stagingOf(name), name, { dropTarget: true })
      onCollection(name, counts[name])
    }
  } finally {
    for (const name of DUMP_COLLECTIONS) {
      await db.collection(stagingOf(name)).drop().catch(() => null)
    }
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

        // Read before the library is touched: a config that cannot be restored stops the restore first
        const entry = directory.files.find(({ path }) => path === 'config.json')

        if (entry && entry.uncompressedSize > DUMP_ENTRY_MAX) {
          throw new Error('Not a Sensorr dump, its config.json is too large')
        }

        const restored = entry && restoreConfig(state.config.getProperties(), JSON.parse((await entry.buffer()).toString()))

        const counts = await restore({
          directory,
          manifest,
          onCollection: (name, count) => setTask((task) => ({ ...task, output: <Text><Text bold={true}>{count}</Text> {name} written...</Text> })),
        })

        // Key by key, the save of Settings would hand the policy of each list to the movies just restored. Only the
        // keys this Sensorr knows: an unknown one would be kept as is, and leave in the next dump
        for (const [key, value] of Object.entries(restored || {}).filter(([key]) => state.config.has(key))) {
          const { uri, params, init } = api.query.config.putConfig({ body: { key, value } })
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
