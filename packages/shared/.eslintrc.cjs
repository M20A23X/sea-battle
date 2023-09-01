module.exports = {
  extends: [
    "../../.eslintrc"
  ],
  parserOptions: {
    project: "tsconfig.json",
    tsconfigRootDir: __dirname
  },
  settings: {
    "import/resolver": {
      typescript: {
        extensions: [".ts"],
        moduleDirectory: [".", "src/"]
      }
    }
  }
};