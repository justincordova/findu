import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
  {
<<<<<<< HEAD
    ignores: ["node_modules", "dist", "build", "coverage", "src/generated/**"],
=======
    ignores: [
      "node_modules",
      "dist",
      "build",
      "src/generated/**",
      "coverage", 
    ],
>>>>>>> 22dc5cfc6311268736584268451cfa92ab4d02b7
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      "no-unused-vars": "off",
      "no-shadow": "off",
      "no-redeclare": "off",
      "no-use-before-define": "off",

      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-shadow": "error",
      "@typescript-eslint/no-redeclare": "error",
      "@typescript-eslint/no-use-before-define": "error",
    },
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
];
