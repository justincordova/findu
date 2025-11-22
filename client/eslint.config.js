// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  {
    ignores: ["node_modules", "dist", "build", "coverage", ".expo"],
  },
  expoConfig,
]);
