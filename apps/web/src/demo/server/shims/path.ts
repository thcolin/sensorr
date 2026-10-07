// The path helpers `apps/api` calls at load time, on POSIX paths

export const sep = '/'

export const normalize = (path: string) => {
  const absolute = path.startsWith('/')
  const parts = path.split('/').reduce((acc, part) => part === '..' ? acc.slice(0, -1) : (part && part !== '.') ? [...acc, part] : acc, [] as string[])
  return `${absolute ? '/' : ''}${parts.join('/')}`
}

export const join = (...paths: string[]) => normalize(paths.filter(Boolean).join('/'))
export const resolve = (...paths: string[]) => normalize(paths.reduce((acc, path) => path.startsWith('/') ? path : `${acc}/${path}`, '/'))
export const dirname = (path: string) => normalize(path).split('/').slice(0, -1).join('/') || '/'
export const basename = (path: string, extension = '') => {
  const base = normalize(path).split('/').pop() || ''
  return extension && base.endsWith(extension) ? base.slice(0, -extension.length) : base
}
export const extname = (path: string) => /(\.[^./]+)$/.exec(basename(path))?.[1] || ''

export default { sep, normalize, join, resolve, dirname, basename, extname }
