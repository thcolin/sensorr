import { execFile, spawn } from 'node:child_process'
import { timingSafeEqual } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const PORT = Number(process.env.UPDATER_PORT || 4310)
const SECRET = process.env.UPDATER_SECRET_FILE || '/secrets/updater'
const SELF = 'sensorr-updater'
const RUN = 'sensorr-updater-run'
const SERVICES = ['sensorr-api', 'sensorr-web', 'sensorr-updater']
export const TAGS = ['beta', 'latest']

const run = promisify(execFile)
const docker = async (...args) => (await run('docker', args, { maxBuffer: 1 << 20 })).stdout

// Compose reads the last `SENSORR_TAG=` line, so every one takes the tag
export const withTag = (text, tag) => {
  const lines = text.split('\n')
  const found = lines.some((line) => line.startsWith('SENSORR_TAG='))

  if (found) {
    return lines.map((line) => (line.startsWith('SENSORR_TAG=') ? `SENSORR_TAG=${tag}` : line)).join('\n')
  }

  return `${text}${text && !text.endsWith('\n') ? '\n' : ''}SENSORR_TAG=${tag}\n`
}

export const projectOf = (labels) => {
  const directory = labels['com.docker.compose.project.working_dir']

  return {
    name: labels['com.docker.compose.project'],
    directory,
    files: (labels['com.docker.compose.project.config_files'] || '').split(',').filter(Boolean),
    env: labels['com.docker.compose.project.environment_file'] || join(directory, '.env'),
  }
}

const inspect = async (name) => {
  try {
    return JSON.parse(await docker('inspect', '--type', 'container', name))[0]
  } catch {
    return null
  }
}

const imageOf = (container) => container && {
  image: container.Config.Image,
  version: container.Config.Labels?.['org.opencontainers.image.version'] || null,
  revision: container.Config.Labels?.['org.opencontainers.image.revision'] || null,
}

const status = async () => {
  const [api, web, last] = await Promise.all(['sensorr-api', 'sensorr-web', RUN].map(inspect))

  return {
    api: imageOf(api),
    web: imageOf(web),
    run: last && {
      status: last.State.Status,
      code: last.State.ExitCode,
      tag: last.Args.at(-1),
      started: last.State.StartedAt,
      finished: last.State.Status === 'exited' ? last.State.FinishedAt : null,
    },
  }
}

// `apply` runs in a container of its own, which outlives the recreation of sensorr-updater
const update = async (tag) => {
  const self = await inspect(SELF)

  if (!self) {
    throw Object.assign(new Error(`No "${SELF}" container, it runs under another name`), { status: 500 })
  }

  const last = await inspect(RUN)

  if (last?.State.Running) {
    throw Object.assign(new Error('An update is already running'), { status: 409 })
  }

  const project = projectOf(self.Config.Labels || {})
  const folders = [...new Set([project.directory, dirname(project.env), ...project.files.map(dirname)])]

  if (last) {
    await docker('rm', '-f', RUN)
  }

  await docker(
    'run', '--detach', '--name', RUN, '--network', 'none',
    '--volume', '/var/run/docker.sock:/var/run/docker.sock',
    ...folders.flatMap((folder) => ['--volume', `${folder}:${folder}`]),
    '--entrypoint', 'node', self.Image,
    '/app/main.mjs', 'apply', JSON.stringify(project), tag,
  )
}

const apply = async (project, tag) => {
  await writeFile(project.env, withTag(await readFile(project.env, 'utf8').catch(() => ''), tag))
  console.log(`SENSORR_TAG=${tag} in ${project.env}`)

  const compose = [
    'compose', '--project-name', project.name, '--project-directory', project.directory,
    ...project.files.flatMap((file) => ['--file', file]), '--env-file', project.env, '--profile', 'updater',
  ]

  for (const step of [['pull', ...SERVICES], ['up', '--detach', ...SERVICES]]) {
    const code = await new Promise((resolve) => spawn('docker', [...compose, ...step], { stdio: 'inherit' }).on('close', resolve))

    if (code !== 0) {
      process.exit(code || 1)
    }
  }
}

const authorized = async (header = '') => {
  const secret = Buffer.from(`Bearer ${(await readFile(SECRET, 'utf8').catch(() => '')).trim()}`)
  const given = Buffer.from(header)

  return secret.length > 'Bearer '.length && given.length === secret.length && timingSafeEqual(given, secret)
}

const reply = (res, code, body) => {
  res.writeHead(code, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

const serve = () => createServer(async (req, res) => {
  try {
    if (!(await authorized(req.headers.authorization))) {
      return reply(res, 401, { message: 'Unauthorized' })
    }

    if (req.method === 'GET' && req.url === '/status') {
      return reply(res, 200, await status())
    }

    if (req.method === 'POST' && req.url === '/update') {
      let body = ''

      for await (const chunk of req) {
        body += chunk
      }

      const { tag } = JSON.parse(body || '{}')

      if (!TAGS.includes(tag)) {
        return reply(res, 400, { message: `Unknown tag "${tag}", expected ${TAGS.join(' or ')}` })
      }

      await update(tag)
      return reply(res, 202, { tag })
    }

    reply(res, 404, { message: 'Not found' })
  } catch (err) {
    console.error(err)
    reply(res, err.status || 500, { message: err.stderr?.trim() || err.message })
  }
}).listen(PORT, () => console.log(`sensorr-updater listening on ${PORT}`))

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [command, project, tag] = process.argv.slice(2)

  if (command === 'apply') {
    apply(JSON.parse(project), tag).catch((err) => {
      console.error(err)
      process.exit(1)
    })
  } else {
    serve()
  }
}
