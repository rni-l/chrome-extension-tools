import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { bgCyan, black } from 'kolorist'

export const port = Number(process.env.PORT || '') || 3304
export const r = (...args: string[]) => resolve(dirname(new URL(import.meta.url).pathname), '..', ...args)
export const isDev = process.env.NODE_ENV !== 'production'
export const isFirefox = process.env.EXTENSION === 'firefox'

export function log(name: string, message: string) {
  console.log(black(bgCyan(` ${name} `)), message)
}
