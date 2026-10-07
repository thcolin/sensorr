module.exports = {
  displayName: 'ui',
  preset: '../../jest.preset.js',
  transform: {
    '^.+\\.[tj]sx?$': ['babel-jest', { cwd: __dirname, configFile: './babel-jest.config.json' }],
  },
  transformIgnorePatterns: ['node_modules/(?!(query-string|decode-uri-component|split-on-first|filter-obj|country-emoji|color|color-convert|color-string|color-name|intl-messageformat|@formatjs|@dicebear)/)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/libs/ui',
}
