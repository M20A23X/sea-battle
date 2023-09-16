const { removeModuleScopePlugin, override, addWebpackAlias, addWebpackPlugin, babelInclude } = require("customize-cra");
const path = require("path");
const Dotenv = require("dotenv-webpack");

module.exports = override(removeModuleScopePlugin(),
  addWebpackPlugin(new Dotenv()),
  addWebpackAlias({
    ["#"]: path.resolve(__dirname, "src"),
    ["#shared"]: path.resolve(__dirname, "..", "shared", "dist", "src")
  }),
  babelInclude([
    path.resolve(path.resolve(__dirname, "src")),
    path.resolve(path.resolve(__dirname, "..", "shared", "dist", "src"))
  ]));
