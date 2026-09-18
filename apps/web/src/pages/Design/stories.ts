import { ComponentType } from 'react'

// `require.context` is a webpack API, `@types/webpack-env` is not installed
declare const require: {
  context(path: string, deep: boolean, filter: RegExp): {
    keys(): string[]
    (key: string): { [name: string]: any }
  }
}

export type Layout = 'padded' | 'fullscreen'

export interface Story {
  key: string
  name: string
  layout: Layout
  render: ComponentType<any>
  args: { [prop: string]: any }
}

export interface Component {
  slug: string
  title: string
  label: string
  stories: Story[]
}

export interface Stage {
  slug: string
  label: string
  components: Component[]
}

// `fullscreen` hands the story the page width and lets it own its height, `padded` boxes it in a
// fixed canvas. A story asks with `layout`, on its `export default` or on the export itself, these
// two need `fullscreen` and don't declare it yet.
const fallbacks: { [title: string]: Layout } = {
  'Elements / Grid': 'fullscreen',
  'Elements / List': 'fullscreen',
}

const slugify = (value: string) => value
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')

const context = require.context('../../../../../libs/ui/src', true, /\.stories\.tsx$/)

const modules = context.keys().map((key) => {
  const { default: meta, ...stories } = context(key)
  const title = meta?.title || key
  // `./atoms/Badge/Badge.stories.tsx`
  const [, stage] = key.split('/')
  const file = key.split('/').pop().replace('.stories.tsx', '')
  const label = title.split(' / ').slice(1).join(' / ') || title

  return {
    stage,
    title,
    label,
    file,
    // `Atoms / Button` gives `button`, `Components / Movie / filters / Genres` gives `movie-filters-genres`
    slug: slugify(label),
    stories: Object.keys(stories).map((name) => ({
      key: `${key}#${name}`,
      name,
      layout: (stories[name].layout || meta?.layout || fallbacks[title] || 'padded') as Layout,
      render: stories[name],
      args: stories[name].args || {},
    })),
  }
})

// two story files sharing a `title` claim the same slug, both fall back on their file name
const disambiguate = (module: typeof modules[number], claims: string[]) => (
  claims.indexOf(module.slug) === claims.lastIndexOf(module.slug) ? module : {
    ...module,
    slug: slugify(`${module.label} ${module.file}`),
    label: `${module.label} (${module.file})`,
  }
)

const components = (stage: string): Component[] => {
  const scoped = modules.filter(module => module.stage === stage)
  const claims = scoped.map(module => module.slug)

  return scoped
    .map(module => disambiguate(module, claims))
    .sort((a, b) => a.label.localeCompare(b.label))
    .map(({ slug, title, label, stories }) => ({ slug, title, label, stories }))
}

export const stages: Stage[] = modules
  .map(module => module.stage)
  .filter((stage, index, list) => list.indexOf(stage) === index)
  .sort((a, b) => a.localeCompare(b))
  .map(stage => ({
    slug: stage,
    label: `${stage.charAt(0).toUpperCase()}${stage.slice(1)}`,
    components: components(stage),
  }))
