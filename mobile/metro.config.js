const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Let Metro alias @aquasustain/shared directly to mobile's local src/shared
config.resolver.extraNodeModules = {
  '@aquasustain/shared': path.resolve(__dirname, 'src/shared'),
};

module.exports = config;
