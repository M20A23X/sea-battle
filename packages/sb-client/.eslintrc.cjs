module.exports = {
  extends: [
    "../../.eslintrc",
    "plugin:react/recommended",
    "react-app",
    "react-app/jest"
  ],
  env: {
    browser: true
  },
  parserOptions: {
    project: "tsconfig.json",
    tsconfigRootDir: __dirname
  },
  plugins: [
    "react",
    "react-hooks",
    "jsx-a11y",
    "import"
  ],
  rules: {
    "react-hooks/rules-of-hooks": "warn",
    "react-hooks/exhaustive-deps": "off",
    "react/require-default-props": "off",
    "react/function-component-definition": "off",
    "react/destructuring-assignment": "off"
  },
  settings: {
    "import/resolver": {
      typescript: {
        extensions: [".ts", "d.ts", ".tsx"],
        moduleDirectory: [".", "src/", "node_modules/"]
      }
    }
  }
};