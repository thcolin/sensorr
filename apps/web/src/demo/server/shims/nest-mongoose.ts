// What `apps/api` imports from `@nestjs/mongoose`: the schemas keep their collection, the type and default of each
// property, and each service the names of the models it is given

import 'reflect-metadata'

export type Property = { type?: any, default?: any }

export const collections = new Map<any, string>()
export const properties = new Map<any, { [key: string]: Property }>()
export const injections = new Map<any, { [index: number]: string }>()

export const Schema = (options: { collection?: string } = {}) => (target: any) => {
  collections.set(target, options.collection || `${target.name.toLowerCase()}s`)
  return target
}

export const Prop = (options: any = {}) => (target: any, key: string) => {
  const declared = (options && !Array.isArray(options) && typeof options === 'object') ? options : {}
  properties.set(target.constructor, {
    ...properties.get(target.constructor),
    [key]: {
      type: declared.type || (Array.isArray(options) ? Array : Reflect.getMetadata('design:type', target, key)),
      ...('default' in declared ? { default: declared.default } : {}),
    },
  })
}

export const raw = (definition: any) => definition

export const InjectModel = (name: string) => (target: any, key: string | undefined, index: number) => {
  injections.set(target, { ...injections.get(target), [index]: name })
}

export const InjectConnection = () => (target: any, key: string | undefined, index: number) => undefined

export const SchemaFactory = {
  createForClass: (target: any) => ({ plugin: () => undefined, index: () => undefined, pre: () => undefined, virtual: () => ({ get: () => undefined }) }),
}

export const getModelToken = (name: string) => `${name}Model`

export const MongooseModule = { forRoot: () => ({}), forFeature: () => ({}) }
