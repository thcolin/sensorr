// The demo's database: one array per collection, read from the visitor's localStorage, or from the seed when they
// have none, and written back after each change. A seed of another version drops what the visitor had.

export type Seed = { version: string, collections: { [collection: string]: any[] }, files: { [name: string]: string } }

const PREFIX = 'sensorr-demo:'
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/
const WRITE_DELAY = 200

const revive = (key: string, value: any) => typeof value === 'string' && ISO.test(value) ? new Date(value) : value

export class Store {
  private readonly data = new Map<string, any[]>()
  private readonly pending = new Map<string, ReturnType<typeof setTimeout>>()
  failed = false

  constructor(private readonly seed: Seed, private readonly storage: Storage | null = globalThis.localStorage ?? null) {
    if (this.read('version') !== seed.version) {
      this.clear()
      this.write('version', seed.version)
    }
  }

  private read(key: string) {
    try {
      return this.storage?.getItem(`${PREFIX}${key}`) ?? null
    } catch (err) {
      return null
    }
  }

  private write(key: string, value: string) {
    try {
      this.storage?.setItem(`${PREFIX}${key}`, value)
    } catch (err) {
      this.failed = true
      globalThis.dispatchEvent?.(new Event(`${PREFIX}storage`))
    }
  }

  private clear() {
    try {
      Object.keys(this.storage || {}).filter((key) => key.startsWith(PREFIX)).forEach((key) => this.storage?.removeItem(key))
    } catch (err) {
      this.failed = true
    }
  }

  collection(name: string): any[] {
    if (!this.data.has(name)) {
      const stored = this.read(`collection:${name}`)
      this.data.set(name, stored ? JSON.parse(stored, revive) : JSON.parse(JSON.stringify(this.seed.collections[name] || []), revive))
    }

    return this.data.get(name)
  }

  file(name: string): string | null {
    return this.read(`file:${name}`) ?? this.seed.files[name] ?? null
  }

  writeFile(name: string, content: string) {
    this.write(`file:${name}`, content)
  }

  replace(name: string, docs: any[]) {
    this.data.set(name, docs)
    this.save(name)
  }

  save(name: string) {
    clearTimeout(this.pending.get(name))
    this.pending.set(name, setTimeout(() => {
      this.pending.delete(name)
      this.write(`collection:${name}`, JSON.stringify(this.data.get(name)))
    }, WRITE_DELAY))
  }

  reset() {
    this.pending.forEach((timeout) => clearTimeout(timeout))
    this.pending.clear()
    this.data.clear()
    this.clear()
    this.write('version', this.seed.version)
  }
}
