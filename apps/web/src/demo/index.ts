import type { ComponentType } from 'react'

// The `demo` build replaces this file with `index.demo.ts`, see `apps/web/project.json`: the other builds carry
// nothing of the demo

export type Demo = { Banner: ComponentType, credentials: { username: string, password: string } }

export const demo: Demo | null = null
