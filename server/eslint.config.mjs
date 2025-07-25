import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default {
  parser: tsParser,
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    project: "./tsconfig.json",  // ensure ESLint can read tsconfig for path aliases
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  settings: {
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true, // always try to resolve types under <root>@types directory
      },
    },
  },
  rules: {
    // your custom rules here
  },
};
