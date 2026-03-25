const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Exclude test files and mocks from the Metro bundle.
// Without this, *.test.tsx files in app/ import Vitest internals which
// cause "Vitest failed to access its internal state" in the web preview.
const TEST_FILE_BLOCK_LIST = [
  /.*\.test\.[jt]sx?$/,
  /.*\/__mocks__\/.*/,
  /.*\/tests\/.*/,
];

config.resolver = {
  ...config.resolver,
  blockList: [
    ...(config.resolver?.blockList
      ? Array.isArray(config.resolver.blockList)
        ? config.resolver.blockList
        : [config.resolver.blockList]
      : []),
    ...TEST_FILE_BLOCK_LIST,
  ],
  // Provide a web-safe stub for react-native-maps on the web platform.
  // react-native-maps uses codegenNativeComponent which is not available on web.
  resolveRequest: (context, moduleName, platform) => {
    if (platform === 'web' && moduleName === 'react-native-maps') {
      return {
        filePath: path.resolve(__dirname, 'lib/stubs/react-native-maps.web.ts'),
        type: 'sourceFile',
      };
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = withNativeWind(config, {
  input: "./global.css",
  // Force write CSS to file system instead of virtual modules
  // This fixes iOS styling issues in development mode
  forceWriteFileSystem: true,
});
