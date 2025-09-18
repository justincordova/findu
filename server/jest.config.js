const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverage: true,
  collectCoverageFrom: [
    "src/modules/**/*.ts",
    "src/lib/**/*.ts",
    "src/providers/**/*.ts",
    "src/utils/**/*.ts",
    "src/middleware/**/*.ts",
    "!src/**/*.d.ts",                   // ignore type declarations
    "!src/generated/**",                // ignore generated prisma code
    "!src/modules/**/controllers.ts",   // ignore controllers
    "!src/modules/**/routes.ts",        // ignore routes
    "!src/modules/**/validators.ts",    // ignore validators
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
};
