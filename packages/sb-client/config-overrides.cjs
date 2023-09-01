const { removeModuleScopePlugin, override, addWebpackAlias, addWebpackPlugin } = require('customize-cra');
const path = require('path');
const Dotenv = require('dotenv-webpack');

module.exports = override(removeModuleScopePlugin(),
  addWebpackPlugin(new Dotenv()),
  addWebpackAlias({
    ['shared']: path.resolve(__dirname, '..', 'shared', 'src')
  }));
