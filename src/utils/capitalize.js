export default function capitalize(str, forceLowerCase = false) {
  return `${str.charAt(0).toUpperCase()}${str.substring(1)[forceLowerCase ? 'toLowerCase' : 'toString']()}`
}
