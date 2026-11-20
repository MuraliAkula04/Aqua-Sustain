// Learn more https://docs.expo.io/guides/monorepos
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and the workspace root
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo (including ../shared)
config.watchFolders = [
  monorepoRoot,
  path.resolve(monorepoRoot, 'shared'),
];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'shared', 'node_modules'),
];

// 3. Make sure extra node modules can resolve
config.resolver.extraNodeModules = {
  '@aquasustain/shared': path.resolve(monorepoRoot, 'shared', 'src'),
};

module.exports = config;
