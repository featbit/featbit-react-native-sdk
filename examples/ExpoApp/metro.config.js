const {getDefaultConfig} = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
];

// Avoid loading React/React Native from the SDK workspace copy.
// In this monorepo, multiple RN copies can cause native module registry errors.
// We disable hierarchical lookup and pin key packages to app-local node_modules.
config.resolver.disableHierarchicalLookup = true;
config.resolver.extraNodeModules = {
    react: path.resolve(projectRoot, 'node_modules/react'),
    'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
    semver: path.resolve(projectRoot, 'node_modules/semver'),
};

config.watchFolders = [
    workspaceRoot,
];

module.exports = config;
