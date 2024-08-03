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
      alias: {
        map: [
          ["#/", "src/"],
          ["#shared/specs", "../shared/specs/"],
          ["#shared", "../shared/src/"]
        ],
        extensions: [".ts"]
      },
      typescript: {
        extensions: [".ts"],
        moduleDirectory: [".", "src/", "../shared/"]
      }
    }
  }
};