// eslint.config.js
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json", // if you use TypeScript
      },
    },
    settings: {
      "import/resolver": {
        alias: {
          map: [["@", "./"]],
          extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
        },
      },
    },
  },
]);
