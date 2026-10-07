// What `apps/api` imports from `@nestjs/common`, enough to run its controllers and services in the demo build

export type Verb = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'SSE'
export type Source = 'body' | 'query' | 'param' | 'none'

export const routes: { target: any, key: string, verb: Verb, path: string }[] = []
export const prefixes = new Map<any, string>()
export const parameters = new Map<any, { [key: string]: { index: number, source: Source, name?: string, pipes: any[] }[] }>()

export const Injectable = (...args: any[]) => (target: any) => target
export const Module = (...args: any[]) => (target: any) => target
export const SetMetadata = (...args: any[]) => (...decorated: any[]) => undefined
export const UseInterceptors = (...args: any[]) => (...decorated: any[]) => undefined

export const Controller = (prefix = '') => (target: any) => {
  prefixes.set(target, prefix)
  return target
}

const route = (verb: Verb) => (path = '') => (target: any, key: string) => {
  routes.push({ target: target.constructor, key, verb, path })
}

export const Get = route('GET')
export const Post = route('POST')
export const Put = route('PUT')
export const Patch = route('PATCH')
export const Delete = route('DELETE')
export const Sse = route('SSE')
export const All = route('GET')

const parameter = (source: Source) => (name?: any, ...pipes: any[]) => (target: any, key: string, index: number) => {
  const [named, piped] = typeof name === 'string' ? [name, pipes] : [undefined, [name, ...pipes].filter(Boolean)]
  const methods = parameters.get(target.constructor) || {}
  methods[key] = [...(methods[key] || []), { index, source, name: named, pipes: piped }]
  parameters.set(target.constructor, methods)
}

export const Body = parameter('body')
export const Query = parameter('query')
export const Param = parameter('param')
export const Req = parameter('none')
export const Res = parameter('none')
export const Next = parameter('none')
export const UploadedFile = parameter('none')

export class HttpException extends Error {
  constructor(private readonly response: any, private readonly status: number) {
    super(typeof response === 'string' ? response : response?.message || `${response}`)
  }

  getStatus() {
    return this.status
  }

  getResponse() {
    return this.response
  }
}

const exception = (status: number, error: string) => class extends HttpException {
  constructor(response: any = error) {
    super(response, status)
  }
}

export const BadRequestException = exception(400, 'Bad Request')
export const UnauthorizedException = exception(401, 'Unauthorized')
export const NotFoundException = exception(404, 'Not Found')
export const ConflictException = exception(409, 'Conflict')
export const UnprocessableEntityException = exception(422, 'Unprocessable Entity')
export const InternalServerErrorException = exception(500, 'Internal Server Error')
export const BadGatewayException = exception(502, 'Bad Gateway')
export const ServiceUnavailableException = exception(503, 'Service Unavailable')

export class ParseIntPipe {
  transform(value: any) {
    const parsed = Number(value)

    if (!/^-?\d+$/.test(`${value}`) || Number.isNaN(parsed)) {
      throw new BadRequestException('Validation failed (numeric string is expected)')
    }

    return parsed
  }
}

export class Logger {
  constructor(private readonly context = '') {}
  log(...args: any[]) {}
  debug(...args: any[]) {}
  verbose(...args: any[]) {}
  warn(...args: any[]) { console.warn(`[${this.context}]`, ...args) }
  error(...args: any[]) { console.error(`[${this.context}]`, ...args) }
}

export interface PipeTransform { transform(value: any, metadata?: any): any }
export interface CanActivate { canActivate(context: any): any }
export interface ExecutionContext { [key: string]: any }
export interface OnModuleInit { onModuleInit(): any }
export interface OnModuleDestroy { onModuleDestroy(): any }
export interface OnApplicationBootstrap { onApplicationBootstrap(): any }
