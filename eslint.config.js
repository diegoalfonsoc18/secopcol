// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      "dist/*",
      "**/__tests__/**",
      "**/*.test.ts",
      "**/*.test.tsx",
      "jest.config.js",
      "jest.setup.js",
    ],
  },
]);
