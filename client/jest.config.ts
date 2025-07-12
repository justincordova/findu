module.exports = {
    preset: 'jest-expo',
    transform: {
      '^.+\\.tsx?$': 'ts-jest',
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
    setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
    testEnvironment: 'node',
    transformIgnorePatterns: [
      'node_modules/(?!(jest-)?(expo|@expo|react-native|@react-native|@react-navigation)/)',
    ],
  };
  