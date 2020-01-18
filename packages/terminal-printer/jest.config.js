module.exports = {
  collectCoverageFrom: ["lib/**/*.ts"],
  coverageThreshold: {
    global: {
      branches: 91,
      functions: 98,
      lines: 98,
      statements: 98,
    },
  },
  globals: {
    "ts-jest": {
      tsConfig: "tsconfig.json",
    },
  },
  moduleFileExtensions: ["js", "ts"],
  testRegex: "\\.test\\.ts$",
  transform: {
    "\\.ts$": "ts-jest",
  },
};
