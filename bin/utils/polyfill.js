// Module alias (@bin, @server, @shared, etc...)
require('module-alias/register')

// Increase defaultMaxListeners to avoid warning
require('events').EventEmitter.defaultMaxListeners = 15

// Use fetch() like in the browser
global.fetch = require('node-fetch')
