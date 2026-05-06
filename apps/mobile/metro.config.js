const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// In a pnpm monorepo, Metro follows symlinks into the pnpm virtual store and
// resolves react/react-native to whichever version pnpm chose for each package
// (e.g. react@18.3.1 for @expo-google-fonts/barlow). resolveRequest intercepts
// at a lower level than extraNodeModules and forces every import of these
// packages to resolve from the mobile app's own node_modules (react@19.1.0).
const PINNED = ['react', 'react-native', 'react/jsx-runtime', 'react/jsx-dev-runtime'];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (PINNED.includes(moduleName)) {
    return {
      filePath: require.resolve(moduleName, { paths: [projectRoot] }),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
