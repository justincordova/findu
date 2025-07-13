module.exports = {
  preset: "jest-expo",
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  testEnvironment: "node",
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?expo|@expo|expo-modules-core|react-native|@react-native|@react-navigation)/)",
  ],
};
