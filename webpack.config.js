const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  mode: 'production',
  entry: {
    index: './src/index.js',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname),
    libraryTarget: 'commonjs-module',
  },
  node: {
    process: false,
  },
  externals: [nodeExternals()],
  optimization: {
    nodeEnv: false,
    minimizer: [
      new UglifyJsPlugin({
        sourceMap: false,
        extractComments: true,
        uglifyOptions: {
          compress: {
            conditionals: false,
          },
          mangle: {
            reserved: ['process'],
          },
          ie8: false,
        },
      }),
    ],
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
            plugins: [
              '@babel/plugin-proposal-object-rest-spread',
              '@babel/plugin-proposal-class-properties',
              '@babel/plugin-transform-runtime',
              '@babel/plugin-proposal-optional-chaining',
            ],
          },
        },
      },
    ],
  },
};
