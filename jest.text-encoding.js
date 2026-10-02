// jsdom leaves out TextEncoder and TextDecoder, which react-router 7 needs at import time
const { TextEncoder, TextDecoder } = require('util')

Object.assign(globalThis, { TextEncoder, TextDecoder })
