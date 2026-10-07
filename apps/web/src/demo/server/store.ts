// The demo's database: one array per collection, read from the visitor's localStorage, or from the seed when they
// have none, and written back after each change. A seed of another version drops what the visitor had.

export type Seed = { version: string, collections: { [collection: string]: any[] }, files: { [name: string]: string } }

const PREFIX = 'sensorr-demo:'
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/
const WRITE_DELAY = 200

// Sent on `globalThis` once the visitor's changes can no longer be kept
export const STORAGE_FAILED = `${PREFIX}storage`

const revive = (key: string, value: any) => typeof value === 'string' && ISO.test(value) ? new Date(value) : value

export class Store {
  private readonly data = new Map<string, any[]>()
  private readonly pending = new Map<string, ReturnType<typeof setTimeout>>()
  private readonly storage: Storage | null
  failed = false

  // With every cookie blocked, reading `localStorage` throws: the demo then keeps the visitor's changes in memory
  constructor(private readonly seed: Seed, storage?: Storage | null) {
    try {
      this.storage = storage === undefined ? globalThis.localStorage : storage
    } catch (err) {
      this.storage = null
      this.failed = true
    }

    if (this.read('version') !== seed.version) {
      this.clear()
      this.write('version', seed.version)
    }

    globalThis.addEventListener?.('pagehide', () => this.flush())
  }

  private read(key: string) {
    try {
      return this.storage?.getItem(`${PREFIX}${key}`) ?? null
    } catch (err) {
      return null
    }
  }

  // A collection that does not fit would be kept next to others that did, a state the services never see: the first
  // failure stops writing and drops what was kept, so a reload starts from the seed again, as the banner then says
  private write(key: string, value: string) {
    if (this.failed) {
      return
    }

    try {
      this.storage?.setItem(`${PREFIX}${key}`, value)
    } catch (err) {
      this.failed = true
      this.clear()
      globalThis.dispatchEvent?.(new Event(STORAGE_FAILED))
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
      this.data.set(name, this.stored(name) ?? JSON.parse(JSON.stringify(this.seed.collections[name] || []), revive))
    }

    return this.data.get(name)
  }

  // What the visitor kept, or nothing when it does not parse: the collection starts from the seed again
  private stored(name: string) {
    const raw = this.read(`collection:${name}`)

    try {
      return raw ? JSON.parse(raw, revive) : null
    } catch (err) {
      console.warn(`[Demo] The stored "${name}" does not parse, it starts from the seed again`)
      this.storage?.removeItem(`${PREFIX}collection:${name}`)
      return null
    }
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
    this.pending.set(name, setTimeout(() => this.persist(name), WRITE_DELAY))
  }

  private persist(name: string) {
    clearTimeout(this.pending.get(name))
    this.pending.delete(name)
    this.write(`collection:${name}`, JSON.stringify(this.data.get(name)))
  }

  // A reload right after a change does not wait for the delay
  flush() {
    [...this.pending.keys()].forEach((name) => this.persist(name))
  }

  reset() {
    this.pending.forEach((timeout) => clearTimeout(timeout))
    this.pending.clear()
    this.data.clear()
    this.clear()
    this.failed = false
    this.write('version', this.seed.version)
  }
}
