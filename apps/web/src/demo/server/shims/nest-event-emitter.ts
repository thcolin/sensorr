// What `apps/api` imports from `@nestjs/event-emitter`: `emit` reaches every `@OnEvent` method of the instances
// the demo server built

export const listeners = new Map<any, { key: string, event: string }[]>()

export const OnEvent = (event: string) => (target: any, key: string) => {
  listeners.set(target.constructor, [...(listeners.get(target.constructor) || []), { key, event }])
}

export class EventEmitter2 {
  private readonly handlers: { event: string, handler: (payload: any) => any }[] = []

  listen(instance: any) {
    for (const { key, event } of listeners.get(instance.constructor) || []) {
      this.handlers.push({ event, handler: (payload) => instance[key](payload) })
    }
  }

  emit(event: string, payload?: any) {
    const handlers = this.handlers.filter((handler) => handler.event === event)
    handlers.forEach(({ handler }) => Promise.resolve(handler(payload)).catch((err) => console.error(`[EventEmitter2] ${event}`, err)))
    return handlers.length > 0
  }
}

export const EventEmitterModule = { forRoot: () => ({}) }
