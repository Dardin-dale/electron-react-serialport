const path = require('path');

module.exports = {
  mode: 'development',
  entry: './main',
  module: {
    rules: [{
      include: /src/
    }]
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  externals: {
    serialport: 'serialport',
  },
  //this is from a webpack bug
  node: {
    fs: "empty"
 }
};