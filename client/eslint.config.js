// eslint.config.js
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  {
<<<<<<< HEAD
    ignores: ["node_modules", "dist", "build", "coverage", ".expo"],
=======
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
>>>>>>> 22dc5cfc6311268736584268451cfa92ab4d02b7
  },
  expoConfig,
]);
