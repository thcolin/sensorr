// The files `apps/api` reads and writes, by name: `config.json`, kept in the demo's store

type Files = { read: (name: string) => string | null, write: (name: string, content: string) => void }

let mounted: Files = { read: () => null, write: () => undefined }

export const mount = (files: Files) => {
  mounted = files
}

const nameOf = (file: string) => `${file}`.split('/').pop()

const missing = (file: string) => Object.assign(new Error(`ENOENT: no such file or directory, open '${file}'`), { code: 'ENOENT' })

export const readFileSync = (file: string, encoding?: any) => {
  const content = mounted.read(nameOf(file))

  if (content === null) {
    throw missing(file)
  }

  return content
}

export const writeFileSync = (file: string, content: any) => mounted.write(nameOf(file), `${content}`)
export const existsSync = (file: string) => mounted.read(nameOf(file)) !== null
export const copyFileSync = (...args: any[]) => undefined
export const mkdirSync = (...args: any[]) => undefined
export const chmodSync = (...args: any[]) => undefined

export const promises = {
  readFile: async (file: string, encoding?: any) => readFileSync(file, encoding),
  writeFile: async (file: string, content: any) => writeFileSync(file, content),
  mkdir: async (...args: any[]) => undefined,
}
