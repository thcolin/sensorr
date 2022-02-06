const rootMain = require('../../../.storybook/main');

// Use the followed syntax to add addons!
// rootMain.addons.push('');
rootMain.stories.push(...['../src/**/*.stories.@(js|jsx|ts|tsx)'])

module.exports = rootMain;
