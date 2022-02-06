const { customAlphabet } = require('nanoid')

export const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 7)

export const clean = (string) => string
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^\sa-zA-Z0-9]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
