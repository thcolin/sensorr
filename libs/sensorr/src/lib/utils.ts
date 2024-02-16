import { customAlphabet } from 'nanoid'

export const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 7)

export const clean = (string, alphabetical = false) => string
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  // .replace(alphabetical ? /[^\sa-zA-Z0-9]/g : /\s/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
