import { customAlphabet } from 'nanoid'

export const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 7)

export const clean = (string) => (string || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '') // Diacritic chars, ex: e + `
  .replace(/[\u2000-\u206f]/g, '') // General Punctuation chars
  .replace(/[\u0021-\u002f]/g, ' ') // Punctuation chars, ex: ! " # $ % & ' ( ) * + , - . /
  .replace(/[\u003a-\u003f]/g, ' ') // Punctuation chars, ex: : ; < = > ?
  .replace(/[\u005b-\u0060]/g, ' ') // Punctuation chars, ex: [ \ ] ^ _ `
  .replace(/[\u007b-\u007f]/g, ' ') // Punctuation chars, ex: { | } ~ DEL
  .replace('Œ', 'OE')
  .replace('œ', 'oe')
  .replace(/\s+/g, ' ')
  .trim()

// The name a stored release is scored on. Sync builds its `title` from the Plex streams, while
// the file name alone often says nothing (`Brazil`); any other release keeps its indexer name.
export const scoredTitle = (release) => release.from === 'sync' ? release.title : release.original
