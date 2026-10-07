import { Subscription } from 'rxjs'
import { App } from './app'

// Every request the web app sends to `/api/` is answered by the demo server instead of the network: `fetch` for
// the routes, `EventSource` for the streams

const isAPI = (url: URL) => url.origin === globalThis.location.origin && /^(.*\/)?api\//.test(url.pathname)

const bodyOf = (body: any) => {
  if (typeof body !== 'string') {
    return body ?? undefined
  }

  try {
    return JSON.parse(body)
  } catch (err) {
    return body
  }
}

export const install = (app: Promise<App>) => {
  const fetch = globalThis.fetch.bind(globalThis)
  const EventSource = globalThis.EventSource

  globalThis.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const request = input instanceof Request ? input : null
    const url = new URL(request ? request.url : `${input}`, globalThis.location.href)

    if (!isAPI(url)) {
      return fetch(input, init)
    }

    const method = (init.method || request?.method || 'GET').toUpperCase() as any
    const response = await (await app).handle(method, url, bodyOf(init.body ?? (request ? await request.text() : undefined)))
    const content = response.body === undefined || response.body === null ? null : JSON.stringify(response.body)

    return new Response(content, { status: response.status, headers: content === null ? {} : { 'Content-Type': 'application/json' } })
  }

  class DemoEventSource extends EventTarget {
    static readonly CONNECTING = 0
    static readonly OPEN = 1
    static readonly CLOSED = 2
    readonly CONNECTING = 0
    readonly OPEN = 1
    readonly CLOSED = 2
    readonly url: string
    readonly withCredentials = false
    readyState = 0
    onopen: ((event: Event) => any) | null = null
    onmessage: ((event: MessageEvent) => any) | null = null
    onerror: ((event: Event) => any) | null = null
    private subscription: Subscription | null = null

    constructor(url: string | URL) {
      super()
      this.url = new URL(`${url}`, globalThis.location.href).href
      setTimeout(() => this.open())
    }

    private emit(event: Event) {
      this.dispatchEvent(event)
      this[`on${event.type}`]?.(event)
    }

    private async open() {
      const { status, stream } = await (await app).handle('SSE', new URL(this.url))

      if (this.readyState === this.CLOSED) {
        return
      }

      if (status !== 200 || !stream) {
        this.readyState = this.CLOSED
        this.emit(new Event('error'))
        return
      }

      this.readyState = this.OPEN
      this.emit(new Event('open'))
      // As Nest writes a `MessageEvent` on the wire: a string as is, anything else as JSON
      this.subscription = stream.subscribe({
        next: (event: any) => this.emit(new MessageEvent(event?.type || 'message', { data: typeof event?.data === 'string' ? event.data : JSON.stringify(event?.data), lastEventId: event?.id || '' })),
        error: () => this.fail(),
        complete: () => this.fail(),
      })
    }

    private fail() {
      this.readyState = this.CLOSED
      this.emit(new Event('error'))
    }

    close() {
      this.readyState = this.CLOSED
      this.subscription?.unsubscribe()
    }
  }

  globalThis.EventSource = new Proxy(DemoEventSource, {
    construct: (target, [url, configuration]) => isAPI(new URL(`${url}`, globalThis.location.href)) ? new DemoEventSource(url) : new EventSource(url, configuration),
  }) as any
}
