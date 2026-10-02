const path = require('path')
const nxPreset = require('@nx/jest/preset').default;

module.exports = { ...nxPreset, setupFiles: [path.join(__dirname, 'jest.text-encoding.js')] };
