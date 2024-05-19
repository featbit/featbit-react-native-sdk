const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

/**
 * Metro configuration4 t
 *
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
  },
  watchFolders: [
    path.resolve(__dirname, '../..'),
  ],
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
