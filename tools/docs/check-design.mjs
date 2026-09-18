import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// `DESIGN.md` copies values out of `libs/theme`, which makes it a second source of truth.
// This checks the copy still matches, and exits 1 when it does not. `libs/theme` always wins.
//
// Three assertions:
//   1. every color of the frontmatter exists in `colors.ts` with the same value
//   2. every font family and weight of `typography` exists in `font.ts`
//   3. the `spacing` scale is `sizes.ts`, same values in the same order
//
// Not asserted: `rounded`, the `components` block, and typography sizes and line heights.
// Those are read off the components, not off `libs/theme`, so there is nothing to compare them to.

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const theme = resolve(root, 'libs/theme/src/lib/theme')
const design = resolve(root, 'DESIGN.md')

const read = (path) => readFileSync(path, 'utf8')

const unquote = (value) => (
  (value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))
    ? value.slice(1, -1)
    : value
)

// The body of the first `{` or `[` after `declaration`, brace-matched so a nested literal does not cut it short
const block = (source, declaration, open) => {
  const start = source.indexOf(declaration)

  if (start === -1) {
    throw new Error(`${declaration} not found`)
  }

  const close = { '{': '}', '[': ']' }[open]
  const from = source.indexOf(open, start)
  let depth = 0

  for (let i = from; i < source.length; i++) {
    depth += source[i] === open ? 1 : source[i] === close ? -1 : 0

    if (depth === 0) {
      return source.slice(from + 1, i)
    }
  }

  throw new Error(`${declaration} is not closed`)
}

// Flat object literal, one `key: value` per line. `...spread` lines are skipped, the caller merges them.
const entries = (body) => body.split('\n').reduce((acc, line) => {
  const match = line.trim().match(/^(?:'([^']+)'|"([^"]+)"|([A-Za-z0-9_$-]+))\s*:\s*(.+?),?$/)

  if (match && !line.trim().startsWith('...')) {
    acc[match[1] || match[2] || match[3]] = match[4]
  }

  return acc
}, {})

// `'hsla(0, 0%, 0%, 1)'` stays a string, `raw.black` and `raw['gray-900']` resolve against `raw`
const resolveColor = (value, raw) => {
  const alias = value.match(/^raw(?:\.([A-Za-z0-9_$]+)|\['([^']+)'\])$/)
  return alias ? raw[alias[1] || alias[2]] : unquote(value)
}

const readTheme = () => {
  const colors = read(resolve(theme, 'colors.ts'))
  const raw = Object.fromEntries(
    Object.entries(entries(block(colors, 'const raw =', '{'))).map(([key, value]) => [key, unquote(value)])
  )

  // `colors` spreads `dark` and exposes `light` under `modes`, so `dark` is what the app renders
  const dark = Object.entries(entries(block(colors, 'export const dark =', '{')))
    .reduce((acc, [key, value]) => ({ ...acc, [key]: resolveColor(value, raw) }), { ...raw })

  const font = read(resolve(theme, 'font.ts'))

  return {
    colors: dark,
    families: Object.values(entries(block(font, 'export const fontFamilies =', '{'))).map(unquote),
    weights: Object.values(entries(block(font, 'export const fontWeights =', '{'))).map(Number),
    sizes: block(read(resolve(theme, 'sizes.ts')), 'export const sizes =', '[').match(/'[^']*'/g).map(unquote),
  }
}

// Enough YAML for this frontmatter: nested maps, two-space indent, scalar leaves. No lists, no anchors,
// no multi-line strings. A frontmatter that needs more than this fails loudly instead of parsing wrong.
const readFrontmatter = (source) => {
  const match = source.match(/^---\n([\s\S]*?)\n---\n/)

  if (!match) {
    throw new Error('DESIGN.md has no YAML frontmatter')
  }

  const root = {}
  const stack = [{ indent: -1, node: root }]

  match[1].split('\n').forEach((line, index) => {
    if (!line.trim() || line.trim().startsWith('#')) {
      return
    }

    const indent = line.length - line.trimStart().length
    const separator = line.indexOf(':')

    if (separator === -1) {
      throw new Error(`frontmatter line ${index + 2} is not a "key: value" pair: ${line.trim()}`)
    }

    const key = unquote(line.slice(0, separator).trim())
    const value = line.slice(separator + 1).trim()

    while (stack[stack.length - 1].indent >= indent) {
      stack.pop()
    }

    const parent = stack[stack.length - 1].node

    if (value === '') {
      parent[key] = {}
      stack.push({ indent, node: parent[key] })
    } else {
      const scalar = unquote(value)
      parent[key] = scalar === value && scalar !== '' && !Number.isNaN(Number(scalar)) ? Number(scalar) : scalar
    }
  })

  return root
}

const theme_ = readTheme()
const front = readFrontmatter(read(design))
const failures = []

// 1. colors
for (const [name, value] of Object.entries(front.colors || {})) {
  if (!(name in theme_.colors)) {
    failures.push(`colors.${name} is not a token of colors.ts`)
  } else if (theme_.colors[name] !== value) {
    failures.push(`colors.${name} is "${value}", colors.ts says "${theme_.colors[name]}"`)
  }
}

// 2. typography families and weights
for (const [role, level] of Object.entries(front.typography || {})) {
  if (level.fontFamily !== undefined && !theme_.families.includes(level.fontFamily)) {
    failures.push(`typography.${role}.fontFamily is not one of the stacks of font.ts`)
  }

  if (level.fontWeight !== undefined && !theme_.weights.includes(Number(level.fontWeight))) {
    failures.push(`typography.${role}.fontWeight is ${level.fontWeight}, not a weight of font.ts (${[...new Set(theme_.weights)].join(', ')})`)
  }
}

// 3. spacing scale
const spacing = Object.entries(front.spacing || {}).sort(([a], [b]) => Number(a) - Number(b))

if (spacing.length !== theme_.sizes.length) {
  failures.push(`spacing has ${spacing.length} steps, sizes.ts has ${theme_.sizes.length}`)
} else {
  spacing.forEach(([step, value], index) => {
    if (String(index) !== step) {
      failures.push(`spacing step "${step}" sits at index ${index}, the scale of sizes.ts is indexed from 0`)
    } else if (value !== theme_.sizes[index]) {
      failures.push(`spacing.${step} is "${value}", sizes.ts says "${theme_.sizes[index]}"`)
    }
  })
}

if (failures.length) {
  console.error(`DESIGN.md has drifted from libs/theme, ${failures.length} ${failures.length > 1 ? 'differences' : 'difference'}:`)
  failures.forEach((failure) => console.error(`  ${failure}`))
  console.error('libs/theme is the source of truth, fix the frontmatter of DESIGN.md.')
  process.exit(1)
}

const counts = [
  `${Object.keys(front.colors || {}).length} colors`,
  `${Object.keys(front.typography || {}).length} typography levels`,
  `${spacing.length} spacing steps`,
]

console.log(`DESIGN.md matches libs/theme (${counts.join(', ')})`)
