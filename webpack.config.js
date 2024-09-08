// webpack.config.js
const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: './index.js', // Adjust to your main entry file
  output: {
    path: path.resolve(__dirname, 'dist'), // Directory for bundled output
    filename: 'bundle.js' // Name of the bundled file
  },
  mode: 'development', // or 'production' for optimized build
  target: 'node', // Make Webpack aware that this is a Node.js application
  externals: [nodeExternals()], // Exclude all Node.js modules from the bundle
};
