export const fileURLToPath = (url: string | URL) => decodeURIComponent(`${url}`.replace(/^file:\/\//, ''))

export default { fileURLToPath }
